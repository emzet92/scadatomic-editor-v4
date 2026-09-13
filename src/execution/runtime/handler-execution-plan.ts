import type { ExecutionGraph } from "../model/execution-graph";
import type { Intent } from "../model/intent";

/**
 * Immutable snapshot of what the planner produced before the Executor starts.
 * This is intentionally separate from HandlerExecution so the UI can compare
 * "planned" with the later execution result.
 */
export type HandlerExecutionPlan = {
  executionId: string;
  parentExecutionId?: string | undefined;
  projectId: string;
  handlerId: string;
  eventName: string;
  sourceNodeId: string;
  scriptId: string;
  intents: Intent[];
  graph: ExecutionGraph;
  createdAt: number;
};
