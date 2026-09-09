export type NodeId = string;
export type ComponentDefinitionId = string;

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

export type ScopedMethodRef = MethodRef & {
  visibility: "public" | "private";
};

export type UiVariant = {
  props: Record<string, unknown>;
};

export type ComponentInputType =
  | "string"
  | "number"
  | "boolean"
  | "color"
  | "tag";

export type ComponentInputDefinition = {
  type: ComponentInputType;
  defaultValue?: unknown;
  target: {
    nodeId: NodeId;
    property: string;
    kind: "prop" | "binding";
  };
};

export type UiComponentDefinition = {
  id: ComponentDefinitionId;
  name: string;
  rootId: NodeId;
  nodes: Record<NodeId, UiNode>;
  inputs?: Record<string, ComponentInputDefinition> | undefined;
  methods?: Record<string, ScopedMethodRef> | undefined;
};

export type UiNode = {
  id: NodeId;
  name: string;
  type: string;
  componentDefinitionId?: ComponentDefinitionId | undefined;
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
  components?: Record<ComponentDefinitionId, UiComponentDefinition> | undefined;
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

  if (
    !Object.entries(candidate.nodes).every(([id, node]) => isUiNode(node, id))
  ) {
    return false;
  }

  if (candidate.components !== undefined) {
    if (
      !isRecord(candidate.components) ||
      !Object.entries(candidate.components).every(([id, definition]) =>
        isComponentDefinition(definition, id)
      )
    ) {
      return false;
    }
  }

  return true;
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

  if (
    node.componentDefinitionId !== undefined &&
    typeof node.componentDefinitionId !== "string"
  ) {
    return false;
  }

  if (
    node.type === "ComponentInstance" &&
    typeof node.componentDefinitionId !== "string"
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
        ([methodName, method]) => isJsIdentifier(methodName) && isMethodRef(method)
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

function isComponentDefinition(
  value: unknown,
  expectedId: string
): value is UiComponentDefinition {
  if (!isRecord(value)) {
    return false;
  }

  if (
    value.id !== expectedId ||
    typeof value.name !== "string" ||
    !isJsIdentifier(value.name) ||
    typeof value.rootId !== "string" ||
    !isRecord(value.nodes)
  ) {
    return false;
  }

  if (
    !Object.entries(value.nodes).every(([id, node]) => isUiNode(node, id)) ||
    !value.nodes[value.rootId]
  ) {
    return false;
  }

  if (value.inputs !== undefined) {
    if (
      !isRecord(value.inputs) ||
      !Object.entries(value.inputs).every(
        ([name, input]) => isJsIdentifier(name) && isComponentInput(input)
      )
    ) {
      return false;
    }
  }

  if (value.methods !== undefined) {
    if (
      !isRecord(value.methods) ||
      !Object.entries(value.methods).every(
        ([name, method]) => isJsIdentifier(name) && isScopedMethodRef(method)
      )
    ) {
      return false;
    }
  }

  return true;
}

function isComponentInput(value: unknown): value is ComponentInputDefinition {
  if (!isRecord(value) || !isRecord(value.target)) {
    return false;
  }

  return (
    ["string", "number", "boolean", "color", "tag"].includes(
      String(value.type)
    ) &&
    typeof value.target.nodeId === "string" &&
    typeof value.target.property === "string" &&
    (value.target.kind === "prop" || value.target.kind === "binding")
  );
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

function isScopedMethodRef(value: unknown): value is ScopedMethodRef {
  return (
    isRecord(value) &&
    typeof value.scriptId === "string" &&
    (value.visibility === "public" || value.visibility === "private")
  );
}

function isUiVariant(value: unknown): value is UiVariant {
  return isRecord(value) && isRecord(value.props);
}

export function isJsIdentifier(value: string) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
