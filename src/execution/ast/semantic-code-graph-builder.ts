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
  program: Program,
  source: string
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
        const names = declarations
          .map((declaration) => patternSummary(asNode(declaration.id)))
          .filter(Boolean);
        const assignments = declarations
          .map((declaration) => {
            const name = patternSummary(asNode(declaration.id));
            const init = asNode(declaration.init);
            return init ? `${name} = ${expressionSummary(init)}` : name;
          })
          .filter(Boolean)
          .join(" · ");
        const id = addNode(
          statement,
          "data",
          names.length > 0 ? `Prepare ${names.join(", ")}` : "Prepare data",
          assignments || undefined
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
        const decisionId = addNode(
          statement,
          "decision",
          "IF",
          test ? expressionSummary(test) : "condition"
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
          loopDetail(statement, source)
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
          "Return",
          argument ? expressionSummary(argument) : "finish handler"
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
          "Throw error",
          argument ? expressionSummary(argument) : undefined
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
        const fnId = asNode(statement.id);
        const name = fnId && typeof fnId.name === "string" ? fnId.name : "function";
        const params = nodeArray(statement.params)
          .map((param) => patternSummary(param))
          .filter(Boolean);
        const id = addNode(
          statement,
          "function",
          `Define ${name}()`,
          params.length > 0 ? `inputs: ${params.join(", ")}` : "no inputs"
        );
        connect(incoming, id);
        return [{ id }];
      }

      case "SwitchStatement": {
        const discriminant = asNode(statement.discriminant);
        const switchId = addNode(
          statement,
          "decision",
          "Switch",
          discriminant ? expressionSummary(discriminant) : "value"
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
        const tryId = addNode(statement, "action", "Try");
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
          humanizeStatement(statement.type),
          compactSource(source, statement.start, statement.end)
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
      const target = left ? expressionSummary(left) : "value";
      const displayTarget = friendlyPath(target);
      const id = addNode(
        statement,
        "action",
        `Set ${displayTarget}`,
        right ? expressionSummary(right) : undefined
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
      const operator = typeof expression.operator === "string" ? expression.operator : "update";
      const id = addNode(
        statement,
        "action",
        `Update ${argument ? friendlyPath(expressionSummary(argument)) : "value"}`,
        operator
      );
      connect(incoming, id);
      return [{ id }];
    }

    if (expression.type === "AwaitExpression") {
      const argument = asNode(expression.argument);
      const id = addNode(
        statement,
        "action",
        "Await",
        argument ? expressionSummary(argument) : undefined
      );
      connect(incoming, id);
      return [{ id }];
    }

    const id = addNode(
      statement,
      "action",
      "Evaluate",
      expressionSummary(expression)
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
        label: `Emit ${eventName}`,
        ...(args.length > 1 ? { detail: `payload: ${args[1]}` } : {}),
      };
    }

    if (calleePath === "ctx.navigateTo") {
      return {
        kind: "navigation",
        label: "Navigate",
        detail: friendlyValue(args[0] ?? "page"),
      };
    }

    if (calleePath.startsWith("ctx.nav.") && calleePath.endsWith(".go")) {
      return {
        kind: "navigation",
        label: "Navigate",
        detail: calleePath.slice("ctx.nav.".length, -".go".length),
      };
    }

    if (calleePath === "ctx.log" || calleePath.startsWith("console.")) {
      return {
        kind: "action",
        label: "Log",
        ...(args[0] ? { detail: args[0] } : {}),
      };
    }

    if (calleePath === "ctx.state.set") {
      return {
        kind: "data",
        label: "Set session state",
        detail: args.length > 0 ? args.join(" = ") : undefined,
      };
    }

    if (calleePath === "ctx.state.delete") {
      return {
        kind: "data",
        label: "Delete session state",
        detail: args[0],
      };
    }

    if (calleePath === "ctx.state.clear") {
      return { kind: "data", label: "Clear session state" };
    }

    const variantMatch = calleePath.match(/^(.*)\.variant\.([^.]*)$/);
    if (variantMatch) {
      return {
        kind: "action",
        label: `Variant ${friendlyPath(variantMatch[1] ?? "component")}`,
        detail: variantMatch[2] ?? "variant",
      };
    }

    return {
      kind: "action",
      label: `Call ${friendlyPath(calleePath)}()`,
      ...(args.length > 0 ? { detail: summarizeArgs(args) } : {}),
    };
  }

  const startId = addSyntheticNode("start", "Start", "handler entry");
  const programBody = nodeArray((program as unknown as NodeLike).body);
  const exits = buildStatements(programBody, [{ id: startId }]);
  const endId = addSyntheticNode("end", "End", "handler finished");
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
    case "ForOfStatement": return "For each";
    case "ForInStatement": return "For each key";
    case "WhileStatement": return "While";
    case "DoWhileStatement": return "Do / while";
    default: return "Loop";
  }
}

function loopDetail(statement: NodeLike, source: string): string {
  if (statement.type === "ForOfStatement" || statement.type === "ForInStatement") {
    const left = asNode(statement.left);
    const right = asNode(statement.right);
    return compactText(
      `${loopBindingSummary(left)} ${statement.type === "ForOfStatement" ? "of" : "in"} ${right ? expressionSummary(right) : "collection"}`
    );
  }

  const test = asNode(statement.test);
  if (test) return expressionSummary(test);

  return compactSource(source, statement.start, statement.end) ?? "repeat";
}


function loopBindingSummary(node: NodeLike | undefined): string {
  if (!node) return "item";
  if (node.type === "VariableDeclaration") {
    const declaration = nodeArray(node.declarations)[0];
    return declaration ? patternSummary(asNode(declaration.id)) : "item";
  }
  return expressionSummary(node);
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

function compactSource(source: string, start: number, end: number): string | undefined {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return undefined;
  const text = compactText(source.slice(start, end));
  if (!text) return undefined;
  return text.length > 72 ? `${text.slice(0, 69)}…` : text;
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
