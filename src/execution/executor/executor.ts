import type {
  ExecutionGraph,
  ExecutionNode,
  ExecutionNodeResult,
  ExecutionResult,
} from "../model/execution-graph";
import type { RuntimeEffects } from "./runtime-effects";

export class ExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExecutionError";
  }
}

export class Executor {
  async execute(
    graph: ExecutionGraph,
    effects: RuntimeEffects
  ): Promise<ExecutionResult> {
    const startedAt = Date.now();
    const results = new Map<string, ExecutionNodeResult>();
    const incoming = buildIncoming(graph);

    for (const node of graph.nodes) {
      const dependencies = incoming.get(node.id) ?? [];
      const blocked = dependencies.some((dependencyId) => {
        const result = results.get(dependencyId);
        return !result || result.status !== "success";
      });

      if (blocked) {
        results.set(node.id, toResult(node, "skipped"));
        continue;
      }

      const nodeStartedAt = Date.now();
      try {
        await executeNode(node, effects);
        results.set(node.id, {
          ...toResult(node, "success"),
          startedAt: nodeStartedAt,
          finishedAt: Date.now(),
        });
      } catch (error) {
        results.set(node.id, {
          ...toResult(node, "failed"),
          startedAt: nodeStartedAt,
          finishedAt: Date.now(),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const nodeResults = graph.nodes.map((node) => results.get(node.id)!);
    const failedCount = nodeResults.filter((result) => result.status === "failed").length;
    const skippedCount = nodeResults.filter((result) => result.status === "skipped").length;
    const successCount = nodeResults.filter((result) => result.status === "success").length;

    return {
      executionId: graph.executionId,
      status:
        failedCount === 0 && skippedCount === 0
          ? "success"
          : successCount === 0
            ? "failed"
            : "partial",
      nodeResults,
      startedAt,
      finishedAt: Date.now(),
    };
  }
}

function buildIncoming(graph: ExecutionGraph): Map<string, string[]> {
  const incoming = new Map<string, string[]>();
  for (const edge of graph.edges) {
    const list = incoming.get(edge.target) ?? [];
    list.push(edge.source);
    incoming.set(edge.target, list);
  }
  return incoming;
}

function toResult(
  node: ExecutionNode,
  status: ExecutionNodeResult["status"]
): ExecutionNodeResult {
  return {
    nodeId: node.id,
    intentId: node.intentId,
    type: node.type,
    status,
  };
}

async function executeNode(node: ExecutionNode, effects: RuntimeEffects) {
  const intent = node.intent;
  switch (intent.type) {
    case "set-value":
      return effects.setValue(intent.target, intent.value);
    case "set-property":
      return effects.setProperty(intent.target, intent.value);
    case "set-variant":
      return effects.setVariant(intent.target, intent.variantName);
    case "emit-event":
      return effects.emitEvent(intent.event, intent.payload);
    case "modal-open":
      return effects.openModal(intent.target, intent.payload);
    case "modal-close":
      return effects.closeModal(intent.target, intent.payload);
    case "navigate":
      return effects.navigate(intent.path);
    case "theme-set":
      return effects.setTheme(intent.themeId);
    case "state-set":
      return effects.setState(intent.key, intent.value);
    case "state-delete":
      return effects.deleteState(intent.key);
    case "state-clear":
      return effects.clearState();
    case "call-method":
      return intent.expanded
        ? undefined
        : effects.callMethod(intent.target, intent.args);
    default: {
      const exhaustive: never = intent;
      throw new ExecutionError(`Unsupported execution intent: ${String(exhaustive)}`);
    }
  }
}
