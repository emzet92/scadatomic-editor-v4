import type { ExecutionGraph, ExecutionResult } from "../model/execution-graph";
import type { Intent } from "../model/intent";

export type HandlerExecution = {
  executionId: string;
  parentExecutionId?: string | undefined;
  projectId: string;
  handlerId: string;
  eventName: string;
  sourceNodeId: string;
  scriptId: string;
  intents: Intent[];
  graph: ExecutionGraph;
  result?: ExecutionResult | undefined;
  createdAt: number;
};
