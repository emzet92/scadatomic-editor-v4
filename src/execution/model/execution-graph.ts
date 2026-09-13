import type { Intent, IntentSource } from "./intent";

export type ExecutionNodeStatus =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "skipped";

export type ExecutionNode = {
  id: string;
  type: Intent["type"];
  intentId: string;
  intent: Intent;
  status?: ExecutionNodeStatus | undefined;
};

export type ExecutionEdge = {
  id: string;
  source: string;
  target: string;
  type: "dependency" | "sequence";
};

export type ExecutionGraphMetadata = {
  createdAt: number;
  source: IntentSource;
  intentCount: number;
};

export type ExecutionGraph = {
  id: string;
  executionId: string;
  nodes: ExecutionNode[];
  edges: ExecutionEdge[];
  entryNodeIds: string[];
  metadata: ExecutionGraphMetadata;
};

export type ExecutionNodeResult = {
  nodeId: string;
  intentId: string;
  type: ExecutionNode["type"];
  status: Exclude<ExecutionNodeStatus, "pending" | "running">;
  startedAt?: number | undefined;
  finishedAt?: number | undefined;
  error?: string | undefined;
};

export type ExecutionResult = {
  executionId: string;
  status: "success" | "failed" | "partial";
  nodeResults: ExecutionNodeResult[];
  startedAt: number;
  finishedAt: number;
};
