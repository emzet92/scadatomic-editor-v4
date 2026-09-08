export type NodeId = string;

export type TagBinding = {
  kind: "tag";
  path: string;
};

export type Binding = TagBinding;

export type HandlerRef = {
  handlerId: string;
};

export type UiNode = {
  id: NodeId;
  type: string;
  props?: Record<string, unknown> | undefined;
  bindings?: Record<string, Binding> | undefined;
  events?: Record<string, HandlerRef> | undefined;
  children?: NodeId[] | undefined;
};

export type UiDocument = {
  schemaVersion: 1;
  rootId: NodeId;
  nodes: Record<NodeId, UiNode>;
};

export function createUiDocument(
  rootId: NodeId,
  nodes: Record<NodeId, UiNode>
): UiDocument {
  return {
    schemaVersion: 1,
    rootId,
    nodes,
  };
}

export function createEmptyUiDocument(): UiDocument {
  return createUiDocument("root", {});
}

export function isUiDocument(value: unknown): value is UiDocument {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  if (
    candidate.schemaVersion !== 1 ||
    typeof candidate.rootId !== "string" ||
    !candidate.nodes ||
    typeof candidate.nodes !== "object" ||
    Array.isArray(candidate.nodes)
  ) {
    return false;
  }

  return Object.entries(candidate.nodes).every(([id, node]) =>
    isUiNode(node, id)
  );
}

export function parseUiDocument(value: unknown): UiDocument {
  if (!isUiDocument(value)) {
    throw new Error("Invalid UiDocument v1");
  }

  return value;
}

function isUiNode(value: unknown, expectedId: string): value is UiNode {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const node = value as Record<string, unknown>;
  if (node.id !== expectedId || typeof node.type !== "string") {
    return false;
  }

  if (node.props !== undefined && !isRecord(node.props)) {
    return false;
  }

  if (
    node.children !== undefined &&
    (!Array.isArray(node.children) ||
      !node.children.every((childId) => typeof childId === "string"))
  ) {
    return false;
  }

  if (
    node.bindings !== undefined &&
    (!isRecord(node.bindings) ||
      !Object.values(node.bindings).every(isBinding))
  ) {
    return false;
  }

  if (
    node.events !== undefined &&
    (!isRecord(node.events) || !Object.values(node.events).every(isHandlerRef))
  ) {
    return false;
  }

  return true;
}

function isBinding(value: unknown): value is Binding {
  if (!isRecord(value)) {
    return false;
  }

  return value.kind === "tag" && typeof value.path === "string";
}

function isHandlerRef(value: unknown): value is HandlerRef {
  return isRecord(value) && typeof value.handlerId === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
