import { buildDocumentIndex } from "./document-index";
import type { NodeId, UiDocument, UiNode } from "./document";

export type DuplicateNodeSubtreeResult = {
  document: UiDocument;
  duplicatedNodeId: NodeId | null;
};

/**
 * Duplicates a node directly after the source inside the same parent.
 *
 * Every node in the copied subtree receives both:
 * - a fresh technical UUID (`node.id`)
 * - a fresh page/component-scoped script name (`node.name`)
 *
 * References to component definitions, scripts, bindings, variants and props are
 * intentionally preserved, while the parent/child node ids are remapped to the
 * newly created subtree.
 */
export function duplicateNodeSubtree(
  document: UiDocument,
  nodeId: NodeId,
  rootId: NodeId = document.rootId
): DuplicateNodeSubtreeResult {
  if (nodeId === rootId || !document.nodes[nodeId]) {
    return { document, duplicatedNodeId: null };
  }

  const index = buildDocumentIndex(document, rootId);
  const parentId = index.parentById.get(nodeId);
  const parent = parentId ? document.nodes[parentId] : undefined;
  if (!parent?.children) {
    return { document, duplicatedNodeId: null };
  }

  const sourceIndex = parent.children.indexOf(nodeId);
  if (sourceIndex < 0) {
    return { document, duplicatedNodeId: null };
  }

  const subtreeIds = collectSubtreeIds(document, nodeId);
  if (subtreeIds.length === 0) {
    return { document, duplicatedNodeId: null };
  }

  const idMap = new Map<NodeId, NodeId>();
  for (const sourceId of subtreeIds) {
    idMap.set(sourceId, crypto.randomUUID());
  }

  const usedNames = collectUsedNames(document, rootId);
  const nextNodes: Record<NodeId, UiNode> = { ...document.nodes };

  for (const sourceId of subtreeIds) {
    const source = document.nodes[sourceId];
    const duplicateId = idMap.get(sourceId);
    if (!source || !duplicateId) continue;

    const duplicateName = createUniqueDuplicateName(source.name, usedNames);
    usedNames.add(duplicateName);

    const duplicate = structuredClone(source);
    duplicate.id = duplicateId;
    duplicate.name = duplicateName;
    if (source.children !== undefined) {
      duplicate.children = source.children
        .filter((childId) => idMap.has(childId))
        .map((childId) => idMap.get(childId) as NodeId);
    }

    nextNodes[duplicateId] = duplicate;
  }

  const duplicatedNodeId = idMap.get(nodeId) ?? null;
  if (!duplicatedNodeId) {
    return { document, duplicatedNodeId: null };
  }

  nextNodes[parent.id] = {
    ...parent,
    children: [
      ...parent.children.slice(0, sourceIndex + 1),
      duplicatedNodeId,
      ...parent.children.slice(sourceIndex + 1),
    ],
  };

  return {
    document: {
      ...document,
      nodes: nextNodes,
    },
    duplicatedNodeId,
  };
}

function collectSubtreeIds(document: UiDocument, rootId: NodeId): NodeId[] {
  const result: NodeId[] = [];
  const visited = new Set<NodeId>();

  function visit(currentId: NodeId) {
    if (visited.has(currentId)) return;
    visited.add(currentId);

    const node = document.nodes[currentId];
    if (!node) return;

    result.push(currentId);
    for (const childId of node.children ?? []) {
      visit(childId);
    }
  }

  visit(rootId);
  return result;
}

function collectUsedNames(document: UiDocument, rootId: NodeId): Set<string> {
  return new Set(
    collectSubtreeIds(document, rootId)
      .map((id) => document.nodes[id]?.name)
      .filter((name): name is string => !!name)
  );
}

function createUniqueDuplicateName(
  sourceName: string,
  usedNames: ReadonlySet<string>
): string {
  const numericSuffix = /^(.*?)(\d+)$/.exec(sourceName);
  const base = numericSuffix?.[1] || sourceName;
  let index = numericSuffix ? Number(numericSuffix[2]) + 1 : 2;
  let candidate = `${base}${index}`;

  while (usedNames.has(candidate)) {
    index += 1;
    candidate = `${base}${index}`;
  }

  return candidate;
}
