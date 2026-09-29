import type { Node as AcornNode, Program } from "acorn";

export type SemanticCodeNodeKind =
  | "start"
  | "end"
  | "decision"
  | "loop"
  | "data"
  | "action"
  | "event"
  | "navigation"
  | "function"
  | "return"
  | "error";

export type SemanticCodeGraphNode = {
  id: string;
  kind: SemanticCodeNodeKind;
  label: string;
  detail?: string | undefined;
  location?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  } | undefined;
};

export type SemanticCodeGraphEdge = {
  id: string;
  source: string;
  target: string;
  role: string;
};

export type SemanticCodeGraph = {
  nodes: SemanticCodeGraphNode[];
  edges: SemanticCodeGraphEdge[];
};

type NodeLike = AcornNode & Record<string, unknown>;
type Incoming = { id: string; role?: string | undefined };

export function buildSemanticCodeGraph(
  program: Program
): SemanticCodeGraph {
  const nodes: SemanticCodeGraphNode[] = [];
  const edges: SemanticCodeGraphEdge[] = [];
  const terminalNodes: Incoming[] = [];
  let syntheticCounter = 0;
  let edgeCounter = 0;

  function addSyntheticNode(
    kind: SemanticCodeNodeKind,
    label: string,
    detail?: string
  ): string {
    syntheticCounter += 1;
    const id = `semantic:${kind}:${syntheticCounter}`;
    nodes.push({ id, kind, label, ...(detail ? { detail } : {}) });
    return id;
  }

  function addNode(
    node: NodeLike,
    kind: SemanticCodeNodeKind,
    label: string,
    detail?: string
  ): string {
    const id = `${node.type}:${node.start}:${node.end}`;
    nodes.push({
      id,
      kind,
      label,
      ...(detail ? { detail } : {}),
      ...(node.loc
        ? {
            location: {
              startLine: node.loc.start.line,
              startColumn: node.loc.start.column,
              endLine: node.loc.end.line,
              endColumn: node.loc.end.column,
            },
          }
        : {}),
    });
    return id;
  }

  function connect(incoming: readonly Incoming[], target: string): void {
    for (const input of incoming) {
      edgeCounter += 1;
      edges.push({
        id: `semantic-edge:${edgeCounter}`,
        source: input.id,
        target,
        role: input.role ?? "next",
      });
    }
  }

  function buildStatements(
    statements: readonly NodeLike[],
    incoming: Incoming[]
  ): Incoming[] {
    let exits = incoming;
    for (const statement of statements) {
      exits = buildStatement(statement, exits);
    }
    return exits;
  }

  function buildStatement(statement: NodeLike, incoming: Incoming[]): Incoming[] {
    switch (statement.type) {
      case "BlockStatement": {
        return buildStatements(nodeArray(statement.body), incoming);
      }

      case "VariableDeclaration": {
        const declarations = nodeArray(statement.declarations);
        const id = addNode(
          statement,
          "data",
          "Prepare data",
          declarations.length > 1 ? `Prepare ${declarations.length} working values` : "Prepare a working value"
        );
        connect(incoming, id);
        return [{ id }];
      }

      case "ExpressionStatement": {
        const expression = asNode(statement.expression);
        if (!expression) return incoming;
        return buildExpressionStatement(statement, expression, incoming);
      }

      case "IfStatement": {
        const test = asNode(statement.test);
        const decision = describeCondition(test);
        const decisionId = addNode(
          statement,
          "decision",
          decision.label,
          decision.detail
        );
        connect(incoming, decisionId);

        const consequent = asNode(statement.consequent);
        const alternate = asNode(statement.alternate);
        const trueExits = consequent
          ? buildStatement(consequent, [{ id: decisionId, role: "true" }])
          : [{ id: decisionId, role: "true" }];
        const falseExits = alternate
          ? buildStatement(alternate, [{ id: decisionId, role: "false" }])
          : [{ id: decisionId, role: "false" }];
        return [...trueExits, ...falseExits];
      }

      case "ForStatement":
      case "ForInStatement":
      case "ForOfStatement":
      case "WhileStatement":
      case "DoWhileStatement": {
        const loopId = addNode(
          statement,
          "loop",
          loopLabel(statement),
          loopDetail(statement)
        );
        connect(incoming, loopId);
        const body = asNode(statement.body);
        if (body) {
          const bodyExits = buildStatement(body, [{ id: loopId, role: "body" }]);
          if (bodyExits.length > 0) {
            const repeatId = addSyntheticNode("loop", "Repeat", "next iteration");
            connect(bodyExits, repeatId);
          }
        }
        return [{ id: loopId, role: "done" }];
      }

      case "ReturnStatement": {
        const argument = asNode(statement.argument);
        const id = addNode(
          statement,
          "return",
          "Finish handler",
          argument ? "Return a result" : "Stop this flow"
        );
        connect(incoming, id);
        terminalNodes.push({ id, role: "return" });
        return [];
      }

      case "ThrowStatement": {
        const argument = asNode(statement.argument);
        const id = addNode(
          statement,
          "error",
          "Stop with error",
          argument ? "Report an error and stop" : "Stop this flow"
        );
        connect(incoming, id);
        terminalNodes.push({ id, role: "error" });
        return [];
      }

      case "BreakStatement":
      case "ContinueStatement": {
        const id = addNode(
          statement,
          "action",
          statement.type === "BreakStatement" ? "Break loop" : "Continue loop"
        );
        connect(incoming, id);
        return [];
      }

      case "FunctionDeclaration": {
        const params = nodeArray(statement.params)
          .map((param) => patternSummary(param))
          .filter(Boolean);
        const id = addNode(
          statement,
          "function",
          "Prepare helper step",
          params.length > 0 ? "Reusable logic with inputs" : "Reusable logic"
        );
        connect(incoming, id);
        return [{ id }];
      }

      case "SwitchStatement": {
        const discriminant = asNode(statement.discriminant);
        const switchId = addNode(
          statement,
          "decision",
          "Choose path",
          discriminant ? `Based on ${describeSubject(discriminant)}` : "Choose one path"
        );
        connect(incoming, switchId);
        const cases = nodeArray(statement.cases);
        if (cases.length === 0) return [{ id: switchId }];
        const exits: Incoming[] = [];
        for (const switchCase of cases) {
          const test = asNode(switchCase.test);
          const role = test ? `case ${expressionSummary(test)}` : "default";
          const consequent = nodeArray(switchCase.consequent);
          if (consequent.length === 0) {
            exits.push({ id: switchId, role });
          } else {
            exits.push(...buildStatements(consequent, [{ id: switchId, role }]));
          }
        }
        return exits;
      }

      case "TryStatement": {
        const tryId = addNode(statement, "action", "Run protected step", "Continue even if an error is possible");
        connect(incoming, tryId);
        const block = asNode(statement.block);
        let exits = block ? buildStatement(block, [{ id: tryId, role: "try" }]) : [{ id: tryId }];

        const handler = asNode(statement.handler);
        if (handler) {
          const catchBody = asNode(handler.body);
          const catchExits = catchBody
            ? buildStatement(catchBody, [{ id: tryId, role: "catch" }])
            : [{ id: tryId, role: "catch" }];
          exits = [...exits, ...catchExits];
        }

        const finalizer = asNode(statement.finalizer);
        return finalizer ? buildStatement(finalizer, exits) : exits;
      }

      case "EmptyStatement":
        return incoming;

      default: {
        const id = addNode(
          statement,
          "action",
          friendlyUnknownAction(statement.type)
        );
        connect(incoming, id);
        return [{ id }];
      }
    }
  }

  function buildExpressionStatement(
    statement: NodeLike,
    expression: NodeLike,
    incoming: Incoming[]
  ): Incoming[] {
    if (expression.type === "AssignmentExpression") {
      const left = asNode(expression.left);
      const right = asNode(expression.right);
      const displayTarget = left ? describeTarget(left) : "value";
      const id = addNode(
        statement,
        "action",
        `Update ${displayTarget}`,
        right ? describeValueSource(right) : "Use a new value"
      );
      connect(incoming, id);
      return [{ id }];
    }

    if (expression.type === "CallExpression") {
      const description = describeCall(expression);
      const id = addNode(
        statement,
        description.kind,
        description.label,
        description.detail
      );
      connect(incoming, id);
      return [{ id }];
    }

    if (expression.type === "UpdateExpression") {
      const argument = asNode(expression.argument);
      const id = addNode(
        statement,
        "action",
        `Update ${argument ? describeTarget(argument) : "value"}`,
        "Adjust the current value"
      );
      connect(incoming, id);
      return [{ id }];
    }

    if (expression.type === "AwaitExpression") {
      const argument = asNode(expression.argument);
      const id = addNode(
        statement,
        "action",
        "Wait for operation",
        argument ? describeOperation(argument) : "Wait until the step finishes"
      );
      connect(incoming, id);
      return [{ id }];
    }

    const id = addNode(
      statement,
      "action",
      "Run action",
      "Perform the next handler step"
    );
    connect(incoming, id);
    return [{ id }];
  }

  function describeCall(call: NodeLike): {
    kind: SemanticCodeNodeKind;
    label: string;
    detail?: string | undefined;
  } {
    const callee = asNode(call.callee);
    const calleePath = callee ? expressionSummary(callee) : "function";
    const args = nodeArray(call.arguments).map(expressionSummary);

    if (calleePath === "ctx.emit" || calleePath.endsWith(".emit")) {
      const eventName = calleePath === "ctx.emit"
        ? friendlyValue(args[0] ?? "event")
        : friendlyPath(calleePath.slice(0, -".emit".length));
      return {
        kind: "event",
        label: "Send event",
        detail: eventName ? `Event: ${humanizeName(eventName)}` : "Notify the next flow",
      };
    }

    if (calleePath === "ctx.navigateTo") {
      return {
        kind: "navigation",
        label: "Open page",
        detail: humanizeName(friendlyValue(args[0] ?? "page")),
      };
    }

    if (calleePath.startsWith("ctx.nav.") && calleePath.endsWith(".go")) {
      return {
        kind: "navigation",
        label: "Open page",
        detail: humanizeName(calleePath.slice("ctx.nav.".length, -".go".length)),
      };
    }

    if (calleePath === "ctx.log" || calleePath.startsWith("console.")) {
      return {
        kind: "action",
        label: "Record message",
        detail: "Write information to the runtime log",
      };
    }

    if (calleePath === "ctx.state.set") {
      return {
        kind: "data",
        label: "Update session data",
        detail: "Remember a value for this session",
      };
    }

    if (calleePath === "ctx.state.delete") {
      return {
        kind: "data",
        label: "Remove session data",
        detail: "Forget a stored session value",
      };
    }

    if (calleePath === "ctx.state.clear") {
      return { kind: "data", label: "Clear session data", detail: "Forget all stored session values" };
    }

    const variantMatch = calleePath.match(/^(.*)\.variant\.([^.]*)$/);
    if (variantMatch) {
      return {
        kind: "action",
        label: `Change ${humanizePath(variantMatch[1] ?? "component")} appearance`,
        detail: variantMatch[2] ? `Use ${humanizeName(variantMatch[2])}` : "Use another variant",
      };
    }

    return describeFriendlyCall(calleePath);
  }

  const startId = addSyntheticNode("start", "Start", "Handler begins");
  const programBody = nodeArray((program as unknown as NodeLike).body);
  const exits = buildStatements(programBody, [{ id: startId }]);
  const endId = addSyntheticNode("end", "Done", "Handler finished");
  connect([...exits, ...terminalNodes], endId);

  if (programBody.length === 0) {
    connect([{ id: startId }], endId);
  }

  return { nodes, edges };
}

function asNode(value: unknown): NodeLike | undefined {
  if (!value || typeof value !== "object") return undefined;
  if (typeof (value as { type?: unknown }).type !== "string") return undefined;
  return value as NodeLike;
}

function nodeArray(value: unknown): NodeLike[] {
  if (!Array.isArray(value)) return [];
  return value.map(asNode).filter((entry): entry is NodeLike => !!entry);
}

function patternSummary(node: NodeLike | undefined): string {
  if (!node) return "value";
  if (node.type === "Identifier" && typeof node.name === "string") return node.name;
  if (node.type === "ObjectPattern") return "object";
  if (node.type === "ArrayPattern") return "items";
  if (node.type === "RestElement") {
    const argument = asNode(node.argument);
    return `...${patternSummary(argument)}`;
  }
  return expressionSummary(node);
}

function expressionSummary(node: NodeLike): string {
  switch (node.type) {
    case "Identifier":
      return typeof node.name === "string" ? node.name : "value";

    case "Literal":
      return formatLiteral(node.value);

    case "ThisExpression":
      return "this";

    case "MemberExpression": {
      const object = asNode(node.object);
      const property = asNode(node.property);
      const objectText = object ? expressionSummary(object) : "object";
      const propertyText = property ? expressionSummary(property) : "property";
      return node.computed ? `${objectText}[${propertyText}]` : `${objectText}.${propertyText}`;
    }

    case "BinaryExpression":
    case "LogicalExpression": {
      const left = asNode(node.left);
      const right = asNode(node.right);
      const operator = typeof node.operator === "string" ? node.operator : "?";
      return compactText(
        `${left ? expressionSummary(left) : "value"} ${operator} ${right ? expressionSummary(right) : "value"}`
      );
    }

    case "UnaryExpression": {
      const argument = asNode(node.argument);
      const operator = typeof node.operator === "string" ? node.operator : "";
      return compactText(`${operator}${argument ? expressionSummary(argument) : "value"}`);
    }

    case "UpdateExpression": {
      const argument = asNode(node.argument);
      const operator = typeof node.operator === "string" ? node.operator : "";
      return `${argument ? expressionSummary(argument) : "value"}${operator}`;
    }

    case "CallExpression": {
      const callee = asNode(node.callee);
      const args = nodeArray(node.arguments).map(expressionSummary);
      return compactText(`${callee ? expressionSummary(callee) : "function"}(${summarizeArgs(args)})`);
    }

    case "AssignmentExpression": {
      const left = asNode(node.left);
      const right = asNode(node.right);
      const operator = typeof node.operator === "string" ? node.operator : "=";
      return compactText(
        `${left ? expressionSummary(left) : "value"} ${operator} ${right ? expressionSummary(right) : "value"}`
      );
    }

    case "ConditionalExpression": {
      const test = asNode(node.test);
      return `${test ? expressionSummary(test) : "condition"} ? … : …`;
    }

    case "ArrayExpression":
      return "[…]";

    case "ObjectExpression":
      return "{…}";

    case "TemplateLiteral":
      return "template text";

    case "ArrowFunctionExpression":
    case "FunctionExpression":
      return "function";

    case "AwaitExpression": {
      const argument = asNode(node.argument);
      return `await ${argument ? expressionSummary(argument) : "operation"}`;
    }

    case "NewExpression": {
      const callee = asNode(node.callee);
      return `new ${callee ? expressionSummary(callee) : "Object"}(…)`;
    }

    case "ChainExpression": {
      const expression = asNode(node.expression);
      return expression ? expressionSummary(expression) : "optional chain";
    }

    default:
      return humanizeStatement(node.type);
  }
}

function loopLabel(statement: NodeLike): string {
  switch (statement.type) {
    case "ForOfStatement": return "Repeat for each item";
    case "ForInStatement": return "Repeat for each entry";
    case "WhileStatement": return "Repeat while needed";
    case "DoWhileStatement": return "Repeat step";
    default: return "Repeat";
  }
}

function loopDetail(statement: NodeLike): string {
  if (statement.type === "ForOfStatement" || statement.type === "ForInStatement") {
    const right = asNode(statement.right);
    return right ? `Use items from ${describeSubject(right)}` : "Process each available item";
  }

  const test = asNode(statement.test);
  if (test) return describeCondition(test).detail ?? "Repeat while the condition is met";

  return "Repeat until the flow can continue";
}


function describeCondition(node: NodeLike | undefined): { label: string; detail?: string } {
  if (!node) return { label: "Check condition", detail: "Choose the next path" };

  if (node.type === "BinaryExpression" || node.type === "LogicalExpression") {
    const left = asNode(node.left);
    const right = asNode(node.right);
    const subject = left ? describeSubject(left) : "value";
    const operator = typeof node.operator === "string" ? node.operator : "";
    return {
      label: `Check ${subject}`,
      detail: comparisonDescription(operator, right),
    };
  }

  if (node.type === "UnaryExpression" && node.operator === "!") {
    const argument = asNode(node.argument);
    return {
      label: `Check ${argument ? describeSubject(argument) : "condition"}`,
      detail: "Continue when it is not active",
    };
  }

  return {
    label: `Check ${describeSubject(node)}`,
    detail: "Choose Yes or No",
  };
}

function comparisonDescription(operator: string, right: NodeLike | undefined): string {
  const value = right ? describeFriendlyValue(right) : undefined;
  switch (operator) {
    case ">": return value ? `Is above ${value}` : "Is above the expected level";
    case ">=": return value ? `Is at least ${value}` : "Reached the expected level";
    case "<": return value ? `Is below ${value}` : "Is below the expected level";
    case "<=": return value ? `Is at most ${value}` : "Is within the upper limit";
    case "==":
    case "===": return value ? `Matches ${value}` : "Matches the expected value";
    case "!=":
    case "!==": return value ? `Does not match ${value}` : "Differs from the expected value";
    case "&&": return "Both conditions must be met";
    case "||": return "At least one condition must be met";
    default: return "Choose Yes or No";
  }
}

function describeTarget(node: NodeLike): string {
  return humanizePath(expressionSummary(node));
}

function describeSubject(node: NodeLike): string {
  if (node.type === "CallExpression") {
    const callee = asNode(node.callee);
    return callee ? humanizePath(expressionSummary(callee)) : "operation result";
  }
  return humanizePath(expressionSummary(node));
}

function describeFriendlyValue(node: NodeLike): string {
  if (node.type === "Literal") {
    if (typeof node.value === "string") return humanizeName(String(node.value));
    if (typeof node.value === "number" || typeof node.value === "boolean") return String(node.value);
    if (node.value === null) return "empty value";
  }
  return "the expected value";
}

function describeValueSource(node: NodeLike): string {
  switch (node.type) {
    case "Literal": return "Use a fixed value";
    case "Identifier": return "Use a prepared value";
    case "MemberExpression": return `Use ${describeSubject(node)}`;
    case "BinaryExpression":
    case "LogicalExpression": return "Use a calculated value";
    case "CallExpression": return "Use the result of another action";
    case "ConditionalExpression": return "Choose the value from a condition";
    case "ObjectExpression": return "Use structured data";
    case "ArrayExpression": return "Use a list of values";
    default: return "Use a new value";
  }
}

function describeOperation(node: NodeLike): string {
  if (node.type === "CallExpression") {
    const callee = asNode(node.callee);
    if (callee) {
      const action = describeFriendlyCall(expressionSummary(callee));
      return action.label;
    }
  }
  return "Wait until the current action finishes";
}

function describeFriendlyCall(
  calleePath: string
): { kind: SemanticCodeNodeKind; label: string; detail?: string } {
  const clean = friendlyPath(calleePath);
  const parts = clean.split(".").filter(Boolean);
  const method = parts.pop() ?? clean;
  const owner = parts.length > 0 ? humanizeName(parts.join(" ")) : undefined;
  const verb = friendlyVerb(method);

  if (owner) {
    return {
      kind: "action",
      label: `${verb} ${owner}`,
      detail: "Run this action",
    };
  }

  return {
    kind: "action",
    label: verb,
    detail: "Run this action",
  };
}

function friendlyVerb(method: string): string {
  const normalized = method.toLowerCase();
  const known: Record<string, string> = {
    start: "Start",
    stop: "Stop",
    reset: "Reset",
    open: "Open",
    close: "Close",
    enable: "Enable",
    disable: "Disable",
    toggle: "Toggle",
    refresh: "Refresh",
    reload: "Reload",
    save: "Save",
    load: "Load",
    clear: "Clear",
    delete: "Remove",
    remove: "Remove",
    add: "Add",
    create: "Create",
    update: "Update",
    process: "Process",
    calculate: "Calculate",
    validate: "Validate",
    send: "Send",
    publish: "Publish",
    connect: "Connect",
    disconnect: "Disconnect",
  };
  return known[normalized] ?? humanizeName(method);
}

function humanizePath(path: string): string {
  const clean = friendlyPath(path)
    .replace(/\[[^\]]+\]/g, " item ")
    .replace(/[(){}]/g, " ")
    .replace(/[+\-*/%<>=!?&|:]+/g, " ");
  return humanizeName(clean.replace(/\./g, " "));
}

function humanizeName(value: string): string {
  const clean = friendlyValue(value)
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return "item";
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function friendlyUnknownAction(type: string): string {
  const name = humanizeStatement(type);
  if (/declaration/i.test(type)) return "Prepare data";
  if (/class/i.test(type)) return "Prepare reusable behavior";
  return name ? `Run ${name.toLowerCase()}` : "Run action";
}

function friendlyValue(value: string): string {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  return value;
}

function friendlyPath(path: string): string {
  return path
    .replace(/^ctx\.ui\./, "")
    .replace(/^ctx\.tags\./, "")
    .replace(/^tags\./, "")
    .replace(/^self\./, "self.")
    .replace(/^internal\./, "internal.");
}

function summarizeArgs(args: readonly string[]): string {
  if (args.length === 0) return "";
  if (args.length <= 2) return args.join(", ");
  return `${args.slice(0, 2).join(", ")}, +${args.length - 2} more`;
}

function formatLiteral(value: unknown): string {
  if (typeof value === "string") {
    const compact = compactText(value);
    return compact.length > 36 ? `"${compact.slice(0, 33)}…"` : JSON.stringify(compact);
  }
  if (value === null) return "null";
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  return "value";
}

function compactText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function humanizeStatement(type: string): string {
  return type
    .replace(/Statement$/, "")
    .replace(/Expression$/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim() || "Action";
}
