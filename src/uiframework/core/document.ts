export type NodeId = string;

export type TagBinding = {
  kind: "tag";
  path: string;
};

export type Binding = TagBinding;

export type HandlerRef = {
  handlerId: string;
};

export type MethodRef = {
  scriptId: string;
};

export type UiVariant = {
  props: Record<string, unknown>;
};

export type UiNode = {
  id: NodeId;
  name: string;
  type: string;
  props?: Record<string, unknown> | undefined;
  bindings?: Record<string, Binding> | undefined;
  events?: Record<string, HandlerRef> | undefined;
  methods?: Record<string, MethodRef> | undefined;
  variants?: Record<string, UiVariant> | undefined;
  defaultVariant?: string | undefined;
  children?: NodeId[] | undefined;
};

export type UiDocument = {
  schemaVersion: 2;
  rootId: NodeId;
  nodes: Record<NodeId, UiNode>;
};

export function createUiDocument(
  rootId: NodeId,
  nodes: Record<NodeId, UiNode>
): UiDocument {
  return {
    schemaVersion: 2,
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
    candidate.schemaVersion !== 2 ||
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
    throw new Error("Invalid UiDocument v2");
  }

  return value;
}

function isUiNode(value: unknown, expectedId: string): value is UiNode {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const node = value as Record<string, unknown>;
  if (
    node.id !== expectedId ||
    typeof node.name !== "string" ||
    node.name.trim().length === 0 ||
    typeof node.type !== "string"
  ) {
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

  if (
    node.methods !== undefined &&
    (!isRecord(node.methods) ||
      !Object.entries(node.methods).every(
        ([methodName, method]) =>
          isJsIdentifier(methodName) && isMethodRef(method)
      ))
  ) {
    return false;
  }

  if (
    node.variants !== undefined &&
    (!isRecord(node.variants) ||
      !Object.entries(node.variants).every(
        ([variantName, variant]) =>
          isJsIdentifier(variantName) && isUiVariant(variant)
      ))
  ) {
    return false;
  }

  if (node.defaultVariant !== undefined) {
    if (
      typeof node.defaultVariant !== "string" ||
      !node.variants?.[node.defaultVariant]
    ) {
      return false;
    }
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

function isMethodRef(value: unknown): value is MethodRef {
  return isRecord(value) && typeof value.scriptId === "string";
}

function isUiVariant(value: unknown): value is UiVariant {
  return isRecord(value) && isRecord(value.props);
}

function isJsIdentifier(value: string) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
