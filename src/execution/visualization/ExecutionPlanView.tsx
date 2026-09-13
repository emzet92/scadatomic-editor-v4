import { useEffect, useMemo, useState } from "react";
import {
  getLatestExecutionPlan,
  subscribeExecutionPlan,
} from "../debug/execution-plan";
import type { HandlerExecutionPlan } from "../runtime/handler-execution-plan";
import { GraphCanvas } from "./GraphCanvas";
import { executionPlanToReactFlow } from "./execution-plan-adapter";

export function ExecutionPlanView({
  projectId,
  handlerId,
}: {
  projectId: string;
  handlerId: string;
}) {
  const [plan, setPlan] = useState<HandlerExecutionPlan | null>(() =>
    getLatestExecutionPlan(projectId, handlerId)
  );

  useEffect(
    () => subscribeExecutionPlan(projectId, handlerId, setPlan),
    [projectId, handlerId]
  );

  const flow = useMemo(
    () => (plan ? executionPlanToReactFlow(plan) : { nodes: [], edges: [] }),
    [plan]
  );

  if (!plan) {
    return (
      <GraphCanvas
        nodes={[]}
        edges={[]}
        emptyMessage="No execution plan available. Run the handler in simulation/runtime to let the Script generate intents and the Planner build a plan."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 font-mono">
          {plan.executionId}
        </span>
        <span>{plan.intents.length} intents</span>
        <span>{plan.graph.nodes.length} planned nodes</span>
        <span>captured before executor</span>
      </div>
      <GraphCanvas
        nodes={flow.nodes}
        edges={flow.edges}
        emptyMessage="The planner produced an empty plan because the handler generated no side effects."
      />
    </div>
  );
}
