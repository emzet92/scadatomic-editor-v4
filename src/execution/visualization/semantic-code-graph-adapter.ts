import { MarkerType, type Edge, type Node } from "@xyflow/react";
import type {
  SemanticCodeGraph,
  SemanticCodeNodeKind,
} from "../ast/semantic-code-graph-builder";
import { layoutDirectedGraph } from "./graph-layout";

export type SemanticCodeFlowNodeData = Record<string, unknown> & {
  title: string;
  detail: string;
  eyebrow: string;
  kind: SemanticCodeNodeKind;
};

export function semanticCodeGraphToReactFlow(graph: SemanticCodeGraph): {
  nodes: Node<SemanticCodeFlowNodeData>[];
  edges: Edge[];
} {
  const layout = layoutDirectedGraph(
    graph.nodes.map((node) => node.id),
    graph.edges,
    { columnWidth: 330, rowHeight: 145 }
  );

  return {
    nodes: graph.nodes.map((node) => ({
      id: node.id,
      position: layout.get(node.id) ?? { x: 0, y: 0 },
      data: {
        title: node.label,
        detail: node.detail ?? "",
        eyebrow: kindLabel(node.kind),
        kind: node.kind,
      },
      style: nodeStyle(node.kind),
    })),
    edges: graph.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      ...(edge.role !== "next" ? { label: edge.role } : {}),
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
      labelStyle: { fontSize: 10, fontWeight: 600 },
    })),
  };
}

function kindLabel(kind: SemanticCodeNodeKind): string {
  switch (kind) {
    case "start": return "FLOW";
    case "end": return "FLOW";
    case "decision": return "DECISION";
    case "loop": return "LOOP";
    case "data": return "DATA";
    case "action": return "ACTION";
    case "event": return "EVENT";
    case "navigation": return "NAVIGATION";
    case "function": return "FUNCTION";
    case "return": return "RETURN";
    case "error": return "ERROR";
  }
}

function nodeStyle(kind: SemanticCodeNodeKind): Record<string, string | number> {
  const base: Record<string, string | number> = {
    width: 250,
    borderRadius: 10,
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
  };

  switch (kind) {
    case "decision":
      return { ...base, borderLeft: "4px solid #d97706", background: "#fffbeb" };
    case "loop":
      return { ...base, borderLeft: "4px solid #7c3aed", background: "#faf5ff" };
    case "event":
      return { ...base, borderLeft: "4px solid #0284c7", background: "#f0f9ff" };
    case "navigation":
      return { ...base, borderLeft: "4px solid #0891b2", background: "#ecfeff" };
    case "data":
      return { ...base, borderLeft: "4px solid #059669", background: "#f0fdf4" };
    case "return":
    case "end":
      return { ...base, borderLeft: "4px solid #52525b", background: "#fafafa" };
    case "error":
      return { ...base, borderLeft: "4px solid #dc2626", background: "#fef2f2" };
    case "start":
      return { ...base, borderLeft: "4px solid #2563eb", background: "#eff6ff" };
    case "function":
      return { ...base, borderLeft: "4px solid #4f46e5", background: "#eef2ff" };
    case "action":
      return { ...base, borderLeft: "4px solid #71717a", background: "#ffffff" };
  }
}
