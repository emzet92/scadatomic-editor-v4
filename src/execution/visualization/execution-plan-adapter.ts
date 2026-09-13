import { MarkerType, type Edge, type Node } from "@xyflow/react";
import type { HandlerExecutionPlan } from "../runtime/handler-execution-plan";
import { intentDetail, intentTitle } from "./execution-graph-adapter";
import { layoutDirectedGraph } from "./graph-layout";

export type ExecutionPlanFlowNodeData = Record<string, unknown> & {
  title: string;
  detail: string;
  kind: "event" | "script" | "intent";
  status?: string | undefined;
};

export type ExecutionPlanFlowNode = Node<ExecutionPlanFlowNodeData>;

export function executionPlanToReactFlow(plan: HandlerExecutionPlan): {
  nodes: ExecutionPlanFlowNode[];
  edges: Edge[];
} {
  const eventId = `${plan.executionId}:plan:source-event`;
  const scriptId = `${plan.executionId}:plan:script`;
  const executionNodes = plan.graph.nodes.map((node) => node.id);
  const rawEdges = [
    { source: eventId, target: scriptId },
    ...(executionNodes[0]
      ? [{ source: scriptId, target: executionNodes[0] }]
      : []),
    ...plan.graph.edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
    })),
  ];
  const allIds = [eventId, scriptId, ...executionNodes];
  const layout = layoutDirectedGraph(allIds, rawEdges, {
    rowHeight: 145,
    columnWidth: 300,
  });

  const nodes: ExecutionPlanFlowNode[] = [
    {
      id: eventId,
      position: layout.get(eventId) ?? { x: 0, y: 0 },
      data: {
        title: plan.eventName,
        detail: `source ${plan.sourceNodeId}`,
        kind: "event",
        status: "source",
      },
    },
    {
      id: scriptId,
      position: layout.get(scriptId) ?? { x: 0, y: 145 },
      data: {
        title: plan.handlerId,
        detail: `${plan.intents.length} intent${plan.intents.length === 1 ? "" : "s"} collected`,
        kind: "script",
        status: "planned",
      },
    },
    ...plan.graph.nodes.map((node) => ({
      id: node.id,
      position: layout.get(node.id) ?? { x: 0, y: 290 },
      data: {
        title: intentTitle(node.intent),
        detail: intentDetail(node.intent),
        kind: "intent" as const,
        status: "planned",
      },
    })),
  ];

  const edges: Edge[] = rawEdges.map((edge, index) => ({
    id: `${plan.executionId}:plan-flow-edge:${index}`,
    source: edge.source,
    target: edge.target,
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
  }));

  return { nodes, edges };
}
