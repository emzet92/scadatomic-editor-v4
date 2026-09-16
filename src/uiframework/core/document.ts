import { createEmptyProjectData, type ProjectData } from "../data/tags/TagDefinition";
import { isProjectData } from "../data/serialization/project-data";
import type { ContainerContentBehavior } from "../repeat/RepeatBehavior";
import { isContainerContentBehavior } from "../repeat/RepeatBehavior";
import type { ReactivePropertyBinding, ReactiveEventHandlerBinding } from "../../reactivity";
import { isReactivePropertyBinding, isReactiveEventHandlerBinding } from "../../reactivity";
import { isDesignSystem, type DesignSystem } from "../design-system/colors";
import { createDefaultDesignSystem, ensureDefaultDesignSystem, getDefaultDesignSystemPropsForType } from "../design-system/default-design-system";
import {
  createDefaultProjectAppearance,
  ensureProjectAppearance,
  isProjectAppearance,
  type ProjectAppearance,
} from "../design-system/theme-config";
export type NodeId = string;
export type PageId = string;
export type ModalId = string;
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

export type Binding = TagBinding | TagRefBinding | ReactivePropertyBinding;

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
export type UiModal = {
  id: ModalId;
  name: string;
  rootId: NodeId;
  closeOnBackdrop?: boolean | undefined;
  closeOnEscape?: boolean | undefined;
};

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
  /** Project-global modal definitions. Modal node trees share the global node table. */
  modals?: Record<ModalId, UiModal> | undefined;
  /** All page nodes. Components remain global per project below. */
  nodes: Record<NodeId, UiNode>;
  components?: Record<ComponentDefinitionId, UiComponentDefinition> | undefined;
  /** Project-local data definitions and persisted designer values. */
  data?: ProjectData | undefined;
  /** Project-local design tokens shared by pages and reusable components. */
  designSystem?: DesignSystem | undefined;
  /** Project runtime theme selection policy. Active runtime theme itself is session state. */
  appearance?: ProjectAppearance | undefined;
  /** Runtime-triggered reactive handlers (tag change/rising/falling edge). */
  reactiveEvents?: Record<string, ReactiveEventHandlerBinding> | undefined;
};

export function createUiDocument(
  rootId: NodeId,
  nodes: Record<NodeId, UiNode>
): UiDocument {
  const rootNode = nodes[rootId];
  const pageId = crypto.randomUUID();
  const designSystem = createDefaultDesignSystem();

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
    designSystem,
    appearance: createDefaultProjectAppearance(designSystem),
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
        ...getDefaultDesignSystemPropsForType("Page"),
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


export function getModal(document: UiDocument, modalId: ModalId): UiModal | undefined {
  return document.modals?.[modalId];
}

export function getModalByRootId(
  document: UiDocument,
  rootId: NodeId
): UiModal | undefined {
  return Object.values(document.modals ?? {}).find((modal) => modal.rootId === rootId);
}

export function createModalRootNode(name: string): UiNode {
  return {
    id: crypto.randomUUID(),
    name,
    type: "Modal",
    props: {
      width: 560,
      minHeight: 240,
      backgroundColor: "#ffffff",
      padding: 24,
      gap: 12,
      columns: 1,
      display: "grid",
      borderRadius: 18,
      shadow: { x: 0, y: 18, blur: 40, spread: -8, color: "rgba(15, 23, 42, 0.20)" },
      ...getDefaultDesignSystemPropsForType("Modal"),
      closeOnBackdrop: true,
      closeOnEscape: true,
    },
    children: [],
  };
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
      ...getDefaultDesignSystemPropsForType("Page"),
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

  if (candidate.modals !== undefined) {
    if (
      !isRecord(candidate.modals) ||
      !Object.entries(candidate.modals).every(([id, modal]) =>
        isUiModal(modal, id, nodes)
      )
    ) {
      return false;
    }
  }

  if (candidate.data !== undefined && !isProjectData(candidate.data)) {
    return false;
  }

  if (candidate.designSystem !== undefined && !isDesignSystem(candidate.designSystem)) {
    return false;
  }

  if (
    candidate.appearance !== undefined &&
    !isProjectAppearance(candidate.appearance, candidate.designSystem as DesignSystem | undefined)
  ) {
    return false;
  }

  if (candidate.reactiveEvents !== undefined) {
    if (
      !isRecord(candidate.reactiveEvents) ||
      !Object.entries(candidate.reactiveEvents).every(
        ([id, binding]) =>
          isReactiveEventHandlerBinding(binding) && binding.id === id
      )
    ) {
      return false;
    }
  }

  return true;
}

export function parseUiDocument(value: unknown): UiDocument {
  if (!isUiDocument(value)) {
    throw new Error("Invalid UiDocument v4");
  }

  const designSystem = ensureDefaultDesignSystem(value.designSystem);

  return {
    ...value,
    designSystem,
    appearance: ensureProjectAppearance(value.appearance, designSystem),
  };
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


function isUiModal(
  value: unknown,
  expectedId: string,
  nodes: Record<string, UiNode>
): value is UiModal {
  if (!isRecord(value)) return false;
  if (
    value.id !== expectedId ||
    typeof value.name !== "string" ||
    !isJsIdentifier(value.name) ||
    typeof value.rootId !== "string" ||
    (value.closeOnBackdrop !== undefined && typeof value.closeOnBackdrop !== "boolean") ||
    (value.closeOnEscape !== undefined && typeof value.closeOnEscape !== "boolean")
  ) {
    return false;
  }
  return nodes[value.rootId]?.type === "Modal";
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
  if (value.kind === "reactive") return isReactivePropertyBinding(value);
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
