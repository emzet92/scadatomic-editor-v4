import type { ExecutionGraph, ExecutionNode } from "../model/execution-graph";
import type { Intent, IntentSource } from "../model/intent";

export class ExecutionPlanningError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExecutionPlanningError";
  }
}

export type PlanningContext = {
  executionId?: string | undefined;
  source: IntentSource;
  validateIntent?: ((intent: Intent) => void) | undefined;
};

/**
 * v1 planner: validates the batch and preserves JavaScript side-effect order by
 * building a linear dependency graph. The model intentionally supports richer
 * dependency graphs later without changing the script API.
 */
export class ExecutionPlanner {
  plan(intents: readonly Intent[], context: PlanningContext): ExecutionGraph {
    validateIntents(intents);
    for (const intent of intents) context.validateIntent?.(intent);

    const executionId = context.executionId ?? crypto.randomUUID();
    const nodes: ExecutionNode[] = intents.map((intent, index) => ({
      id: `${executionId}:node:${index}`,
      type: intent.type,
      intentId: intent.id,
      intent,
      status: "pending",
    }));

    const edges = nodes.slice(1).map((node, index) => ({
      id: `${executionId}:edge:${index}`,
      source: nodes[index]!.id,
      target: node.id,
      type: "sequence" as const,
    }));

    return {
      id: `graph:${executionId}`,
      executionId,
      nodes,
      edges,
      entryNodeIds: nodes[0] ? [nodes[0].id] : [],
      metadata: {
        createdAt: Date.now(),
        source: context.source,
        intentCount: intents.length,
      },
    };
  }
}

function validateIntents(intents: readonly Intent[]): void {
  const ids = new Set<string>();

  for (const intent of intents) {
    if (!intent.id) throw new ExecutionPlanningError("Intent id is required.");
    if (ids.has(intent.id)) {
      throw new ExecutionPlanningError(`Duplicate intent id: ${intent.id}`);
    }
    ids.add(intent.id);

    switch (intent.type) {
      case "set-value":
        if (!intent.target.id || !intent.target.path) {
          throw new ExecutionPlanningError("set-value requires a resolved tag reference.");
        }
        break;
      case "set-property":
        if (!intent.target.componentId || !intent.target.property) {
          throw new ExecutionPlanningError("set-property requires component id and property.");
        }
        break;
      case "set-variant":
        if (!intent.target.componentId || !intent.variantName) {
          throw new ExecutionPlanningError("set-variant requires component id and variant.");
        }
        break;
      case "emit-event":
        if (!intent.event.ownerId || !intent.event.eventName) {
          throw new ExecutionPlanningError("emit-event requires owner id and event name.");
        }
        break;
      case "navigate":
        if (!intent.path) throw new ExecutionPlanningError("navigate requires a path.");
        break;
      case "state-set":
      case "state-delete":
        if (!intent.key) throw new ExecutionPlanningError(`${intent.type} requires a key.`);
        break;
      case "state-clear":
        break;
      case "call-method":
        if (!intent.target.ownerId || !intent.target.method) {
          throw new ExecutionPlanningError("call-method requires a resolved method reference.");
        }
        break;
      default: {
        const exhaustive: never = intent;
        throw new ExecutionPlanningError(`Unknown intent: ${String(exhaustive)}`);
      }
    }
  }
}
