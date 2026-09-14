import { applyDocumentCommand } from "../core/commands";
import type { NodeId, UiDocument, UiNode } from "../core/document";
import { buildDocumentIndex } from "../core/document-index";
import { duplicateNodeSubtree } from "../core/duplicate-node";
import { createUniqueNodeName } from "../core/node-name";
import { wouldCreateComponentCycle } from "../component-repository";
import { getComponentDefinition } from "../registry/component-definitions";
import { canAcceptManualChildren } from "../repeat/RepeatBehavior";

export type NodeInsertDraft = {
  type: UiNode["type"];
  props?: Record<string, unknown>;
  componentDefinitionId?: string | undefined;
};

export type NodeTreeEditingContext = {
  /** The document that physically contains the tree being edited. */
  treeDocument: UiDocument;
  rootId: NodeId;
  /** Full project document, used to resolve reusable-component names/cycles. */
  projectDocument?: UiDocument | undefined;
  /** Set when editing a reusable-component definition. */
  ownerComponentId?: string | undefined;
};

export type NodeInsertResult = {
  document: UiDocument;
  insertedNodeId: NodeId | null;
};

export type NodeDuplicateResult = {
  document: UiDocument;
  duplicatedNodeId: NodeId | null;
};

function projectDocumentOf(context: NodeTreeEditingContext) {
  return context.projectDocument ?? context.treeDocument;
}

export function canInsertIntoTree(
  context: NodeTreeEditingContext,
  parentId: NodeId,
  draft?: Pick<NodeInsertDraft, "componentDefinitionId">
): boolean {
  const parent = context.treeDocument.nodes[parentId];
  const parentDefinition = parent ? getComponentDefinition(parent.type) : undefined;
  if (!parent || !parentDefinition?.acceptsChildren || !canAcceptManualChildren(parent)) {
    return false;
  }

  if (
    context.ownerComponentId &&
    draft?.componentDefinitionId &&
    wouldCreateComponentCycle(
      projectDocumentOf(context),
      context.ownerComponentId,
      draft.componentDefinitionId
    )
  ) {
    return false;
  }

  return true;
}

export function insertNodeIntoTree(
  context: NodeTreeEditingContext,
  parentId: NodeId,
  insertIndex: number,
  draft: NodeInsertDraft
): NodeInsertResult {
  if (!canInsertIntoTree(context, parentId, draft)) {
    return { document: context.treeDocument, insertedNodeId: null };
  }

  const projectDocument = projectDocumentOf(context);
  const registeredDefinition = getComponentDefinition(draft.type);
  const id = crypto.randomUUID();
  const reusableName = draft.componentDefinitionId
    ? projectDocument.components?.[draft.componentDefinitionId]?.name
    : undefined;
  const name = createUniqueNodeName(
    context.treeDocument,
    reusableName ?? draft.type,
    context.rootId
  );
  const node: UiNode = {
    id,
    name,
    type: draft.type,
    componentDefinitionId: draft.componentDefinitionId,
    props: { ...(draft.props ?? {}) },
    children: registeredDefinition?.acceptsChildren ? [] : undefined,
  };

  const document = applyDocumentCommand(
    context.treeDocument,
    { type: "node.insert", parentId, insertIndex, node },
    context.rootId
  );

  return {
    document,
    insertedNodeId: document.nodes[id] ? id : null,
  };
}

export function deleteNodeFromTree(
  context: NodeTreeEditingContext,
  nodeId: NodeId
): UiDocument {
  if (nodeId === context.rootId || !context.treeDocument.nodes[nodeId]) {
    return context.treeDocument;
  }
  return applyDocumentCommand(
    context.treeDocument,
    { type: "node.delete", nodeId },
    context.rootId
  );
}

export function canDuplicateNodeInTree(
  context: NodeTreeEditingContext,
  nodeId: NodeId
): boolean {
  if (nodeId === context.rootId || !context.treeDocument.nodes[nodeId]) return false;
  const index = buildDocumentIndex(context.treeDocument, context.rootId);
  const parentId = index.parentById.get(nodeId);
  if (!parentId) return false;
  return canInsertIntoTree(context, parentId);
}

export function duplicateNodeInTree(
  context: NodeTreeEditingContext,
  nodeId: NodeId
): NodeDuplicateResult {
  if (!canDuplicateNodeInTree(context, nodeId)) {
    return { document: context.treeDocument, duplicatedNodeId: null };
  }
  return duplicateNodeSubtree(context.treeDocument, nodeId, context.rootId);
}

export function moveNodeInTree(
  context: NodeTreeEditingContext,
  nodeId: NodeId,
  targetParentId: NodeId,
  targetIndex: number
): UiDocument {
  if (
    nodeId === context.rootId ||
    !context.treeDocument.nodes[nodeId] ||
    !canInsertIntoTree(context, targetParentId)
  ) {
    return context.treeDocument;
  }

  return applyDocumentCommand(
    context.treeDocument,
    { type: "node.move", nodeId, targetParentId, targetIndex },
    context.rootId
  );
}

export function moveNodeByInTree(
  context: NodeTreeEditingContext,
  nodeId: NodeId,
  offset: -1 | 1
): UiDocument {
  if (nodeId === context.rootId || !context.treeDocument.nodes[nodeId]) {
    return context.treeDocument;
  }
  return applyDocumentCommand(
    context.treeDocument,
    { type: "node.moveBy", nodeId, offset },
    context.rootId
  );
}

export function updateNodeInTree(
  context: NodeTreeEditingContext,
  nodeId: NodeId,
  updater: (node: UiNode) => UiNode
): UiDocument {
  const node = context.treeDocument.nodes[nodeId];
  if (!node) return context.treeDocument;
  return {
    ...context.treeDocument,
    nodes: {
      ...context.treeDocument.nodes,
      [nodeId]: updater(node),
    },
  };
}
