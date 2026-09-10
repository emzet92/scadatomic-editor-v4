import {
  isJsIdentifier,
  type NodeId,
  type UiComponentDefinition,
  type UiDocument,
  type UiNode,
} from "../core/document";
import { buildDocumentIndex } from "../core/document-index";
import { createProjectComponentRepository } from "../component-repository";
import { defaultContainerProps } from "../component-props";

export type CreateReusableComponentResult = {
  document: UiDocument;
  componentId: string;
  instanceNodeId: string;
};

export type ReusableComponentSelectionValidation =
  | { ok: true; nodeIds: NodeId[]; parentId: NodeId }
  | { ok: false; error: string };

export function validateReusableComponentSelection(
  document: UiDocument,
  requestedNodeIds: readonly NodeId[]
): ReusableComponentSelectionValidation {
  const nodeIds = Array.from(new Set(requestedNodeIds)).filter(
    (nodeId) => nodeId !== document.rootId && !!document.nodes[nodeId]
  );

  if (nodeIds.length === 0) {
    return { ok: false, error: "Select at least one component." };
  }

  const index = buildDocumentIndex(document);
  const parentIds = nodeIds.map((nodeId) => index.parentById.get(nodeId));
  const parentId = parentIds[0];

  if (!parentId || parentIds.some((candidate) => candidate !== parentId)) {
    return {
      ok: false,
      error: "Selected components must share the same parent for now.",
    };
  }

  const parent = document.nodes[parentId];
  if (!parent?.children) {
    return { ok: false, error: "Selection has no layout parent." };
  }

  const ordered = parent.children.filter((childId) => nodeIds.includes(childId));
  if (ordered.length !== nodeIds.length) {
    return {
      ok: false,
      error: "Select sibling components, not nested parent/child nodes.",
    };
  }

  return { ok: true, nodeIds: ordered, parentId };
}

export function createReusableComponentFromNode(
  document: UiDocument,
  nodeId: string
): CreateReusableComponentResult {
  return createReusableComponentFromSelection(document, [nodeId]);
}

export function createReusableComponentFromSelection(
  document: UiDocument,
  requestedNodeIds: readonly NodeId[]
): CreateReusableComponentResult {
  const validation = validateReusableComponentSelection(document, requestedNodeIds);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const { nodeIds, parentId } = validation;
  const parent = document.nodes[parentId];
  if (!parent?.children) throw new Error("Selection parent not found.");

  const selectedRoots = nodeIds
    .map((nodeId) => document.nodes[nodeId])
    .filter((node): node is UiNode => !!node);
  const singleSource = selectedRoots.length === 1 ? selectedRoots[0] : undefined;
  const useSourceAsDefinitionRoot = singleSource?.type === "Container";

  const allSourceIds = selectedRoots.flatMap((node) => collectSubtree(document, node.id));
  const uniqueSourceIds = Array.from(new Set(allSourceIds));
  const idMap = new Map<NodeId, NodeId>();
  for (const id of uniqueSourceIds) idMap.set(id, crypto.randomUUID());

  const componentNodes: Record<NodeId, UiNode> = {};
  for (const oldId of uniqueSourceIds) {
    const source = document.nodes[oldId];
    const newId = idMap.get(oldId);
    if (!source || !newId) continue;

    componentNodes[newId] = {
      ...structuredClone(source),
      id: newId,
      children: source.children
        ?.filter((childId) => idMap.has(childId))
        .map((childId) => idMap.get(childId) as NodeId),
    };
  }

  let componentRootId: NodeId;
  if (useSourceAsDefinitionRoot && singleSource) {
    componentRootId = idMap.get(singleSource.id) as NodeId;
  } else {
    componentRootId = crypto.randomUUID();
    const usedInternalNames = new Set(
      Object.values(componentNodes).map((node) => node.name)
    );
    let rootName = "ComponentRoot";
    let rootIndex = 2;
    while (usedInternalNames.has(rootName)) {
      rootName = `ComponentRoot${rootIndex}`;
      rootIndex += 1;
    }

    componentNodes[componentRootId] = {
      id: componentRootId,
      name: rootName,
      type: "Container",
      props: { ...defaultContainerProps },
      children: selectedRoots.map((node) => idMap.get(node.id) as NodeId),
    };
  }

  const componentId = crypto.randomUUID();
  const preferredComponentName = singleSource
    ? `${toIdentifier(singleSource.name)}Component`
    : createUniqueComponentName(document, "Component1");
  const componentName = createUniqueComponentName(document, preferredComponentName);

  const definition: UiComponentDefinition = {
    id: componentId,
    name: componentName,
    rootId: componentRootId,
    nodes: componentNodes,
  };

  const firstSelectedId = nodeIds[0];
  if (!firstSelectedId) throw new Error("Selection is empty.");
  const firstSelectedIndex = parent.children.indexOf(firstSelectedId);
  const instanceNodeId = firstSelectedId;
  const instanceName = singleSource
    ? singleSource.name
    : createUniqueInstanceName(document, componentName);

  const nextNodes = { ...document.nodes };
  for (const selectedRoot of selectedRoots) {
    for (const subtreeId of collectSubtree(document, selectedRoot.id)) {
      delete nextNodes[subtreeId];
    }
  }

  nextNodes[instanceNodeId] = {
    id: instanceNodeId,
    name: instanceName,
    type: "ComponentInstance",
    componentDefinitionId: componentId,
    props: {},
  };

  const remainingChildren = parent.children.filter(
    (childId) => !nodeIds.includes(childId)
  );
  remainingChildren.splice(Math.max(0, firstSelectedIndex), 0, instanceNodeId);
  nextNodes[parentId] = { ...parent, children: remainingChildren };

  const withNodes: UiDocument = { ...document, nodes: nextNodes };
  const repository = createProjectComponentRepository(withNodes);

  return {
    componentId,
    instanceNodeId,
    document: repository.upsert(definition),
  };
}

export function createUniqueComponentName(
  document: UiDocument,
  preferred: string
): string {
  const base = toIdentifier(preferred) || "Component";
  const used = new Set(
    createProjectComponentRepository(document).list().map((component) => component.name)
  );

  if (!used.has(base)) return base;

  let index = 2;
  while (used.has(`${base}${index}`)) index += 1;
  return `${base}${index}`;
}

export function collectSubtree(document: UiDocument, nodeId: string): string[] {
  const result: string[] = [];
  const stack = [nodeId];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId || result.includes(currentId)) continue;
    const node = document.nodes[currentId];
    if (!node) continue;
    result.push(currentId);
    for (const childId of node.children ?? []) stack.push(childId);
  }

  return result;
}

function createUniqueInstanceName(
  document: UiDocument,
  preferred: string
): string {
  const used = new Set(Object.values(document.nodes).map((node) => node.name));
  if (!used.has(preferred)) return preferred;

  let index = 2;
  while (used.has(`${preferred}${index}`)) index += 1;
  return `${preferred}${index}`;
}

function toIdentifier(value: string) {
  const cleaned = value
    .trim()
    .replace(/[^A-Za-z0-9_$]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part, index) =>
      index === 0
        ? part.replace(/^[0-9]+/, "")
        : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join("");

  return isJsIdentifier(cleaned) ? cleaned : "Component";
}
