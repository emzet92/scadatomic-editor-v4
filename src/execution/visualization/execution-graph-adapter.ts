import { MarkerType, type Edge, type Node } from "@xyflow/react";
import type { HandlerExecution } from "../runtime/handler-execution";
import type { Intent } from "../model/intent";
import { layoutDirectedGraph } from "./graph-layout";

export type ExecutionFlowNodeData = Record<string, unknown> & {
  title: string;
  detail: string;
  kind: "event" | "script" | "intent";
  status?: string | undefined;
};

export type ExecutionFlowNode = Node<ExecutionFlowNodeData>;

export function executionToReactFlow(execution: HandlerExecution): {
  nodes: ExecutionFlowNode[];
  edges: Edge[];
} {
  const eventId = `${execution.executionId}:source-event`;
  const scriptId = `${execution.executionId}:script`;
  const executionNodes = execution.graph.nodes.map((node) => node.id);
  const rawEdges = [
    { source: eventId, target: scriptId },
    ...(executionNodes[0] ? [{ source: scriptId, target: executionNodes[0] }] : []),
    ...execution.graph.edges.map((edge) => ({ source: edge.source, target: edge.target })),
  ];
  const allIds = [eventId, scriptId, ...executionNodes];
  const layout = layoutDirectedGraph(allIds, rawEdges, { rowHeight: 145, columnWidth: 300 });
  const resultByNodeId = new Map(
    execution.result?.nodeResults.map((result) => [result.nodeId, result]) ?? []
  );

  const nodes: ExecutionFlowNode[] = [
    {
      id: eventId,
      position: layout.get(eventId) ?? { x: 0, y: 0 },
      data: {
        title: execution.eventName,
        detail: `source ${execution.sourceNodeId}`,
        kind: "event",
      },
    },
    {
      id: scriptId,
      position: layout.get(scriptId) ?? { x: 0, y: 145 },
      data: {
        title: execution.handlerId,
        detail: `${execution.intents.length} intent${execution.intents.length === 1 ? "" : "s"}`,
        kind: "script",
      },
    },
    ...execution.graph.nodes.map((node) => {
      const result = resultByNodeId.get(node.id);
      return {
        id: node.id,
        position: layout.get(node.id) ?? { x: 0, y: 290 },
        data: {
          title: intentTitle(node.intent),
          detail: intentDetail(node.intent),
          kind: "intent" as const,
          status: result?.status ?? node.status,
        },
      };
    }),
  ];

  const edges: Edge[] = rawEdges.map((edge, index) => ({
    id: `${execution.executionId}:flow-edge:${index}`,
    source: edge.source,
    target: edge.target,
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
  }));

  return { nodes, edges };
}

export function intentTitle(intent: Intent): string {
  switch (intent.type) {
    case "set-value": return `Set ${intent.target.path}`;
    case "set-property": return `Set ${intent.target.path ?? intent.target.property}`;
    case "set-variant": return `Variant ${intent.target.path ?? intent.target.componentId}`;
    case "emit-event": return `Emit ${intent.event.eventName}`;
    case "modal-open": return `Open ${intent.target.name}`;
    case "modal-close": return `Close ${intent.target.name}`;
    case "navigate": return `Navigate`;
    case "state-set": return `State set ${intent.key}`;
    case "state-delete": return `State delete ${intent.key}`;
    case "state-clear": return "State clear";
    case "call-method": return `Call ${intent.target.path ?? intent.target.ownerId}.${intent.target.method}()`;
  }
}

export function intentDetail(intent: Intent): string {
  switch (intent.type) {
    case "set-value": return formatValue(intent.value);
    case "set-property": return formatValue(intent.value);
    case "set-variant": return intent.variantName;
    case "emit-event": return intent.payload ? formatValue(intent.payload) : "no payload";
    case "modal-open": return intent.payload ? formatValue(intent.payload) : "open modal";
    case "modal-close": return intent.payload ? formatValue(intent.payload) : "close modal";
    case "navigate": return intent.path;
    case "state-set": return formatValue(intent.value);
    case "state-delete": return "delete";
    case "state-clear": return "clear all session state";
    case "call-method": return `${intent.args.length} args`;
  }
}

function formatValue(value: unknown): string {
  try {
    const json = JSON.stringify(value);
    if (json !== undefined) return json.length > 80 ? `${json.slice(0, 77)}...` : json;
  } catch {
    // Fall through to String.
  }
  return String(value);
}
