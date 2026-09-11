import { createEmptyProjectData, type ProjectData } from "../data/tags/TagDefinition";
import { isProjectData } from "../data/serialization/project-data";
import type { ContainerContentBehavior } from "../repeat/RepeatBehavior";
import { isContainerContentBehavior } from "../repeat/RepeatBehavior";
export type NodeId = string;
export type PageId = string;
export type PageKind = "page" | "layout";
export type ComponentDefinitionId = string;

export type TagBinding = {
  kind: "tag";
  path: string;
};

export type TagRefBinding = {
  kind: "tagRef";
  input: string;
  path: string;
};

export type Binding = TagBinding | TagRefBinding;

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
  | "tag"
  | "tagRef";

export type ComponentInputTarget = {
  nodeId: NodeId;
  property: string;
  kind: "prop" | "binding";
};

export type ComponentInputDefinition =
  | {
      type: Exclude<ComponentInputType, "tagRef">;
      defaultValue?: unknown;
      target: ComponentInputTarget;
    }
  | {
      type: "tagRef";
      udtId: string;
      defaultValue?: unknown;
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
  /** Optional data-driven content behavior. Currently supported on Container nodes. */
  contentBehavior?: ContainerContentBehavior | undefined;
  children?: NodeId[] | undefined;
};

/**
 * Page metadata is project-global while the actual page tree lives in the
 * project-global node table. Node ids stay globally unique inside a project.
 */
export type UiPage = {
  id: PageId;
  name: string;
  rootId: NodeId;
  /** Missing in legacy v4 documents means a regular runtime page. */
  kind?: PageKind | undefined;
  parentPageId?: PageId | undefined;
  /** Regular pages may render inside a PageLayout. */
  layoutId?: PageId | undefined;
};

export type UiDocument = {
  schemaVersion: 4;
  /** Root of the start page. Kept as a convenient default render root. */
  rootId: NodeId;
  startPageId: PageId;
  pages: Record<PageId, UiPage>;
  /** All page nodes. Components remain global per project below. */
  nodes: Record<NodeId, UiNode>;
  components?: Record<ComponentDefinitionId, UiComponentDefinition> | undefined;
  /** Project-local data definitions and persisted designer values. */
  data?: ProjectData | undefined;
};

export function createUiDocument(
  rootId: NodeId,
  nodes: Record<NodeId, UiNode>
): UiDocument {
  const rootNode = nodes[rootId];
  const pageId = crypto.randomUUID();

  return {
    schemaVersion: 4,
    rootId,
    startPageId: pageId,
    pages: {
      [pageId]: {
        id: pageId,
        name: rootNode?.name ?? "Page1",
        rootId,
        kind: "page",
      },
    },
    nodes,
    data: createEmptyProjectData(),
  };
}

export function createEmptyUiDocument(): UiDocument {
  return createUiDocument("root", {
    root: {
      id: "root",
      name: "Page1",
      type: "Page",
      props: {
        deviceMode: "desktop",
        width: 1440,
        height: 900,
        backgroundColor: "#ffffff",
      },
      children: [],
    },
  });
}

export function getPageKind(page: UiPage): PageKind {
  return page.kind === "layout" ? "layout" : "page";
}

export function getStartPage(document: UiDocument): UiPage {
  const configured = document.pages[document.startPageId];
  if (configured && getPageKind(configured) === "page") return configured;
  return Object.values(document.pages).find((page) => getPageKind(page) === "page")!;
}

export function getPage(document: UiDocument, pageId: PageId | undefined): UiPage {
  if (pageId && document.pages[pageId]) {
    return document.pages[pageId]!;
  }
  return getStartPage(document);
}

export function getPageByRootId(
  document: UiDocument,
  rootId: NodeId
): UiPage | undefined {
  return Object.values(document.pages).find((page) => page.rootId === rootId);
}

export function createPageRootNode(name: string): UiNode {
  return {
    id: crypto.randomUUID(),
    name,
    type: "Page",
    props: {
      deviceMode: "desktop",
      width: 1440,
      height: 900,
      backgroundColor: "#ffffff",
      padding: 24,
      gap: 12,
      columns: 1,
      display: "grid",
    },
    children: [],
  };
}

export function createPageLayoutNodes(name: string): { root: UiNode; slot: UiNode } {
  const slot: UiNode = {
    id: crypto.randomUUID(),
    name: "ContentSlot",
    type: "PageSlot",
    props: { slotName: "content" },
  };
  const root = createPageRootNode(name);
  return {
    root: { ...root, children: [slot.id] },
    slot,
  };
}

export function isUiDocument(value: unknown): value is UiDocument {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  if (
    candidate.schemaVersion !== 4 ||
    typeof candidate.rootId !== "string" ||
    typeof candidate.startPageId !== "string" ||
    !isRecord(candidate.pages) ||
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

  const nodes = candidate.nodes as Record<string, UiNode>;
  const pages = candidate.pages as Record<string, unknown>;

  if (
    !Object.entries(pages).every(([id, page]) => isUiPage(page, id, nodes)) ||
    !pages[candidate.startPageId] ||
    !isPageGraphValid(pages as Record<PageId, UiPage>)
  ) {
    return false;
  }

  const startPage = pages[candidate.startPageId] as UiPage;
  if (getPageKind(startPage) !== "page" || candidate.rootId !== startPage.rootId) {
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

  if (candidate.data !== undefined && !isProjectData(candidate.data)) {
    return false;
  }

  return true;
}

export function parseUiDocument(value: unknown): UiDocument {
  if (!isUiDocument(value)) {
    throw new Error("Invalid UiDocument v4");
  }

  return value;
}

function isPageGraphValid(pages: Record<PageId, UiPage>) {
  const rootIds = new Set<NodeId>();

  for (const page of Object.values(pages)) {
    if (rootIds.has(page.rootId)) return false;
    rootIds.add(page.rootId);

    const kind = getPageKind(page);
    if (kind === "layout") {
      if (page.parentPageId || page.layoutId) return false;
      continue;
    }

    if (page.parentPageId) {
      const parent = pages[page.parentPageId];
      if (!parent || getPageKind(parent) !== "page") return false;
    }
    if (page.layoutId) {
      const layout = pages[page.layoutId];
      if (!layout || getPageKind(layout) !== "layout") return false;
    }
  }

  for (const page of Object.values(pages)) {
    if (getPageKind(page) !== "page") continue;
    const visited = new Set<PageId>();
    let current: UiPage | undefined = page;

    while (current?.parentPageId) {
      if (visited.has(current.id)) return false;
      visited.add(current.id);
      current = pages[current.parentPageId];
    }
  }

  return true;
}

function isUiPage(
  value: unknown,
  expectedId: string,
  nodes: Record<string, UiNode>
): value is UiPage {
  if (!isRecord(value)) return false;

  if (
    value.id !== expectedId ||
    typeof value.name !== "string" ||
    !isJsIdentifier(value.name) ||
    typeof value.rootId !== "string" ||
    (value.kind !== undefined && value.kind !== "page" && value.kind !== "layout") ||
    (value.parentPageId !== undefined && typeof value.parentPageId !== "string") ||
    (value.layoutId !== undefined && typeof value.layoutId !== "string")
  ) {
    return false;
  }

  return nodes[value.rootId]?.type === "Page";
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
    node.contentBehavior !== undefined &&
    !isContainerContentBehavior(node.contentBehavior)
  ) {
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
  if (!isRecord(value)) return false;
  if (value.type === "tagRef") {
    return typeof value.udtId === "string";
  }
  if (!isRecord(value.target)) return false;
  return (
    ["string", "number", "boolean", "color", "tag"].includes(String(value.type)) &&
    typeof value.target.nodeId === "string" &&
    typeof value.target.property === "string" &&
    (value.target.kind === "prop" || value.target.kind === "binding")
  );
}

function isBinding(value: unknown): value is Binding {
  if (!isRecord(value)) return false;
  if (value.kind === "tag") return typeof value.path === "string";
  return (
    value.kind === "tagRef" &&
    typeof value.input === "string" &&
    typeof value.path === "string"
  );
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
