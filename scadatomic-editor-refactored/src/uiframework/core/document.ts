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

export type LegacyUiTree = Record<NodeId, UiNode>;

export type UiDocumentInput = UiDocument | LegacyUiTree;

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
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<UiDocument>;

  return (
    candidate.schemaVersion === 1 &&
    typeof candidate.rootId === "string" &&
    !!candidate.nodes &&
    typeof candidate.nodes === "object"
  );
}

export function normalizeUiDocument(input: unknown): UiDocument {
  if (isUiDocument(input)) {
    return {
      ...input,
      nodes: normalizeNodes(input.nodes),
    };
  }

  if (input && typeof input === "object") {
    const nodes = normalizeNodes(input as LegacyUiTree);
    const rootId = nodes.root ? "root" : Object.keys(nodes)[0] ?? "root";

    return createUiDocument(rootId, nodes);
  }

  return createEmptyUiDocument();
}

function normalizeNodes(
  nodes: Record<NodeId, UiNode>
): Record<NodeId, UiNode> {
  return Object.fromEntries(
    Object.entries(nodes).map(([id, node]) => [
      id,
      normalizeNode({
        ...node,
        id: node.id ?? id,
      }),
    ])
  );
}

function normalizeNode(node: UiNode): UiNode {
  const props = {
    ...(node.props ?? {}),
  };

  const bindings = {
    ...(node.bindings ?? {}),
  };

  const events = {
    ...(node.events ?? {}),
  };

  migrateLegacyContainerProps(props);
  migrateLegacyBindings(node.type, props, bindings);
  migrateLegacyEvents(props, events);

  return {
    ...node,
    props,
    bindings: Object.keys(bindings).length > 0 ? bindings : undefined,
    events: Object.keys(events).length > 0 ? events : undefined,
    children: node.children ? [...node.children] : undefined,
  };
}

function migrateLegacyContainerProps(
  props: Record<string, unknown>
) {
  if (
    props.columns === undefined &&
    typeof props.row === "number"
  ) {
    props.columns = Math.max(1, props.row);
  }

  delete props.row;
}

function migrateLegacyBindings(
  type: string,
  props: Record<string, unknown>,
  bindings: Record<string, Binding>
) {
  const tag = props.tag;

  if (
    (type === "Text" || type === "Chart") &&
    typeof tag === "string" &&
    tag.length > 0 &&
    !bindings.value
  ) {
    bindings.value = {
      kind: "tag",
      path: tag,
    };
  }

  // `tag` used to be mixed into visual props. Runtime bindings now own it.
  delete props.tag;
}

function migrateLegacyEvents(
  props: Record<string, unknown>,
  events: Record<string, HandlerRef>
) {
  const clickEvent = props.onClickEvent;
  const doubleClickEvent = props.onDoubleClickEvent;

  if (
    typeof clickEvent === "string" &&
    clickEvent.length > 0 &&
    !events.click
  ) {
    events.click = {
      handlerId: clickEvent,
    };
  }

  if (
    typeof doubleClickEvent === "string" &&
    doubleClickEvent.length > 0 &&
    !events.doubleClick
  ) {
    events.doubleClick = {
      handlerId: doubleClickEvent,
    };
  }

  delete props.onClickEvent;
  delete props.onDoubleClickEvent;
}
