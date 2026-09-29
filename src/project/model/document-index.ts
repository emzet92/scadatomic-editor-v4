import type { NodeId, UiDocument } from "./document";

export type DocumentIndex = {
  parentById: Map<NodeId, NodeId>;
  childIndexById: Map<NodeId, number>;
  depthById: Map<NodeId, number>;
};

export function buildDocumentIndex(
  document: UiDocument,
  rootId: NodeId = document.rootId
): DocumentIndex {
  const parentById = new Map<NodeId, NodeId>();
  const childIndexById = new Map<NodeId, number>();
  const depthById = new Map<NodeId, number>();

  function visit(nodeId: NodeId, depth: number) {
    if (depthById.has(nodeId)) {
      return;
    }

    depthById.set(nodeId, depth);

    const node = document.nodes[nodeId];
    if (!node) {
      return;
    }

    for (const [index, childId] of (node.children ?? []).entries()) {
      parentById.set(childId, nodeId);
      childIndexById.set(childId, index);
      visit(childId, depth + 1);
    }
  }

  visit(rootId, 0);

  return {
    parentById,
    childIndexById,
    depthById,
  };
}
