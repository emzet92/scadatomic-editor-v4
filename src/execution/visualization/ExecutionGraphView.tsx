import { useEffect, useMemo, useState } from "react";
import {
  getLatestExecutionTrace,
  subscribeExecutionTrace,
} from "../debug/execution-trace";
import type { HandlerExecution } from "../runtime/handler-execution";
import { executionToReactFlow } from "./execution-graph-adapter";
import { GraphCanvas } from "./GraphCanvas";

export function ExecutionGraphView({
  projectId,
  handlerId,
}: {
  projectId: string;
  handlerId: string;
}) {
  const [execution, setExecution] = useState<HandlerExecution | null>(() =>
    getLatestExecutionTrace(projectId, handlerId)
  );

  useEffect(() =>
    subscribeExecutionTrace(projectId, handlerId, setExecution),
  [projectId, handlerId]);

  const flow = useMemo(
    () => (execution ? executionToReactFlow(execution) : { nodes: [], edges: [] }),
    [execution]
  );

  if (!execution) {
    return (
      <GraphCanvas
        nodes={[]}
        edges={[]}
        emptyMessage="No execution available. Run the handler in simulation/runtime to generate its Execution Graph."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 font-mono">
          {execution.executionId}
        </span>
        <span>{execution.intents.length} intents</span>
        {execution.result ? <span>status: {execution.result.status}</span> : <span>pending execution</span>}
      </div>
      <GraphCanvas
        nodes={flow.nodes}
        edges={flow.edges}
        emptyMessage="This execution produced no side effects."
      />
    </div>
  );
}
