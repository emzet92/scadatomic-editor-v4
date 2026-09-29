import { MarkerType, type Edge, type Node } from "@xyflow/react";
import type { AstGraph } from "../ast/ast-graph-builder";
import { layoutDirectedGraph } from "./graph-layout";

export type AstFlowNodeData = Record<string, unknown> & {
  title: string;
  detail: string;
};

export function astGraphToReactFlow(graph: AstGraph): {
  nodes: Node<AstFlowNodeData>[];
  edges: Edge[];
} {
  const layout = layoutDirectedGraph(
    graph.nodes.map((node) => node.id),
    graph.edges,
    { columnWidth: 300, rowHeight: 135 }
  );

  return {
    nodes: graph.nodes.map((node) => ({
      id: node.id,
      position: layout.get(node.id) ?? { x: 0, y: 0 },
      data: {
        title: node.label,
        detail: node.sourcePreview ?? node.type,
      },
    })),
    edges: graph.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.role,
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
    })),
  };
}
