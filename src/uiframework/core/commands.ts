import { buildDocumentIndex } from "./document-index";
import type {
  Binding,
  HandlerRef,
  MethodRef,
  NodeId,
  UiDocument,
  UiNode,
} from "./document";

export type DocumentCommand =
  | {
      type: "node.replace";
      node: UiNode;
    }
  | {
      type: "node.insert";
      parentId: NodeId;
      insertIndex: number;
      node: UiNode;
    }
  | {
      type: "node.delete";
      nodeId: NodeId;
    }
  | {
      type: "node.move";
      nodeId: NodeId;
      targetParentId: NodeId;
      targetIndex: number;
    }
  | {
      type: "node.moveBy";
      nodeId: NodeId;
      offset: -1 | 1;
    }
  | {
      type: "node.setProp";
      nodeId: NodeId;
      property: string;
      value: unknown;
    }
  | {
      type: "node.setBinding";
      nodeId: NodeId;
      property: string;
      binding: Binding | null;
    }
  | {
      type: "node.setEvent";
      nodeId: NodeId;
      event: string;
      handler: HandlerRef | null;
    }
  | {
      type: "node.setMethod";
      nodeId: NodeId;
      method: string;
      script: MethodRef | null;
    };

export function applyDocumentCommand(
  document: UiDocument,
  command: DocumentCommand,
  rootId: NodeId = document.rootId
): UiDocument {
  switch (command.type) {
    case "node.replace":
      return replaceNode(document, command.node);

    case "node.insert":
      return insertNode(document, command);

    case "node.delete":
      return deleteNode(document, command.nodeId, rootId);

    case "node.move":
      return moveNode(document, command, rootId);

    case "node.moveBy":
      return moveNodeBy(document, command.nodeId, command.offset, rootId);

    case "node.setProp":
      return setProp(document, command);

    case "node.setBinding":
      return setBinding(document, command);

    case "node.setEvent":
      return setEvent(document, command);

    case "node.setMethod":
      return setMethod(document, command);
  }
}

function replaceNode(
  document: UiDocument,
  node: UiNode
): UiDocument {
  if (!document.nodes[node.id]) {
    return document;
  }

  return withNodes(document, {
    ...document.nodes,
    [node.id]: node,
  });
}

function insertNode(
  document: UiDocument,
  command: Extract<DocumentCommand, { type: "node.insert" }>
): UiDocument {
  const parent = document.nodes[command.parentId];

  if (!parent || document.nodes[command.node.id]) {
    return document;
  }

  const children = parent.children ?? [];
  const safeIndex = clampIndex(command.insertIndex, children.length);

  return withNodes(document, {
    ...document.nodes,
    [command.node.id]: command.node,
    [parent.id]: {
      ...parent,
      children: [
        ...children.slice(0, safeIndex),
        command.node.id,
        ...children.slice(safeIndex),
      ],
    },
  });
}

function deleteNode(
  document: UiDocument,
  nodeId: NodeId,
  rootId: NodeId
): UiDocument {
  if (
    nodeId === rootId ||
    !document.nodes[nodeId]
  ) {
    return document;
  }

  const index = buildDocumentIndex(document, rootId);
  const parentId = index.parentById.get(nodeId);
  const parent = parentId ? document.nodes[parentId] : undefined;

  if (!parent) {
    return document;
  }

  const nextNodes = {
    ...document.nodes,
  };

  function removeSubtree(currentId: NodeId) {
    const current = nextNodes[currentId];
    if (!current) {
      return;
    }

    for (const childId of current.children ?? []) {
      removeSubtree(childId);
    }

    delete nextNodes[currentId];
  }

  removeSubtree(nodeId);

  nextNodes[parent.id] = {
    ...parent,
    children: (parent.children ?? []).filter(
      (childId) => childId !== nodeId
    ),
  };

  return withNodes(document, nextNodes);
}

function moveNodeBy(
  document: UiDocument,
  nodeId: NodeId,
  offset: -1 | 1,
  rootId: NodeId
): UiDocument {
  const index = buildDocumentIndex(document, rootId);
  const parentId = index.parentById.get(nodeId);
  const parent = parentId ? document.nodes[parentId] : undefined;

  if (!parent?.children) {
    return document;
  }

  const currentIndex = parent.children.indexOf(nodeId);
  const targetIndex = currentIndex + offset;

  if (
    currentIndex < 0 ||
    targetIndex < 0 ||
    targetIndex >= parent.children.length
  ) {
    return document;
  }

  const nextChildren = [...parent.children];
  const currentChild = nextChildren[currentIndex];
  const targetChild = nextChildren[targetIndex];

  if (currentChild === undefined || targetChild === undefined) {
    return document;
  }

  nextChildren[currentIndex] = targetChild;
  nextChildren[targetIndex] = currentChild;

  return withNodes(document, {
    ...document.nodes,
    [parent.id]: {
      ...parent,
      children: nextChildren,
    },
  });
}

function moveNode(
  document: UiDocument,
  command: Extract<DocumentCommand, { type: "node.move" }>,
  rootId: NodeId
): UiDocument {
  if (command.nodeId === rootId) {
    return document;
  }

  const node = document.nodes[command.nodeId];
  const targetParent = document.nodes[command.targetParentId];

  if (!node || !targetParent) {
    return document;
  }

  if (
    command.nodeId === command.targetParentId ||
    isDescendant(document, command.nodeId, command.targetParentId)
  ) {
    return document;
  }

  const index = buildDocumentIndex(document, rootId);
  const sourceParentId = index.parentById.get(command.nodeId);
  const sourceParent = sourceParentId
    ? document.nodes[sourceParentId]
    : undefined;

  if (!sourceParent?.children) {
    return document;
  }

  const originalIndex = sourceParent.children.indexOf(command.nodeId);
  const nextNodes = {
    ...document.nodes,
  };

  nextNodes[sourceParent.id] = {
    ...sourceParent,
    children: sourceParent.children.filter(
      (childId) => childId !== command.nodeId
    ),
  };

  const currentTargetParent =
    nextNodes[command.targetParentId] ?? targetParent;
  const targetChildren = currentTargetParent.children ?? [];
  const adjustedIndex =
    sourceParent.id === command.targetParentId &&
    command.targetIndex > originalIndex
      ? command.targetIndex - 1
      : command.targetIndex;
  const safeIndex = clampIndex(adjustedIndex, targetChildren.length);

  nextNodes[command.targetParentId] = {
    ...currentTargetParent,
    children: [
      ...targetChildren.slice(0, safeIndex),
      command.nodeId,
      ...targetChildren.slice(safeIndex),
    ],
  };

  return withNodes(document, nextNodes);
}

function setProp(
  document: UiDocument,
  command: Extract<DocumentCommand, { type: "node.setProp" }>
): UiDocument {
  const node = document.nodes[command.nodeId];
  if (!node) {
    return document;
  }

  return replaceNode(document, {
    ...node,
    props: {
      ...(node.props ?? {}),
      [command.property]: command.value,
    },
  });
}

function setBinding(
  document: UiDocument,
  command: Extract<DocumentCommand, { type: "node.setBinding" }>
): UiDocument {
  const node = document.nodes[command.nodeId];
  if (!node) {
    return document;
  }

  const bindings = {
    ...(node.bindings ?? {}),
  };

  if (command.binding) {
    bindings[command.property] = command.binding;
  } else {
    delete bindings[command.property];
  }

  return replaceNode(document, {
    ...node,
    bindings: Object.keys(bindings).length > 0 ? bindings : undefined,
  });
}

function setEvent(
  document: UiDocument,
  command: Extract<DocumentCommand, { type: "node.setEvent" }>
): UiDocument {
  const node = document.nodes[command.nodeId];
  if (!node) {
    return document;
  }

  const events = {
    ...(node.events ?? {}),
  };

  if (command.handler) {
    events[command.event] = command.handler;
  } else {
    delete events[command.event];
  }

  return replaceNode(document, {
    ...node,
    events: Object.keys(events).length > 0 ? events : undefined,
  });
}

function setMethod(
  document: UiDocument,
  command: Extract<DocumentCommand, { type: "node.setMethod" }>
): UiDocument {
  const node = document.nodes[command.nodeId];
  if (!node) {
    return document;
  }

  const methods = {
    ...(node.methods ?? {}),
  };

  if (command.script) {
    methods[command.method] = command.script;
  } else {
    delete methods[command.method];
  }

  return replaceNode(document, {
    ...node,
    methods: Object.keys(methods).length > 0 ? methods : undefined,
  });
}

function isDescendant(
  document: UiDocument,
  parentId: NodeId,
  candidateId: NodeId
): boolean {
  const parent = document.nodes[parentId];
  if (!parent) {
    return false;
  }

  for (const childId of parent.children ?? []) {
    if (
      childId === candidateId ||
      isDescendant(document, childId, candidateId)
    ) {
      return true;
    }
  }

  return false;
}

function clampIndex(index: number, length: number) {
  return Math.max(0, Math.min(index, length));
}

function withNodes(
  document: UiDocument,
  nodes: Record<NodeId, UiNode>
): UiDocument {
  return {
    ...document,
    nodes,
  };
}
