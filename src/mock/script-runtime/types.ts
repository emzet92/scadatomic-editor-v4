import type { TagRuntime } from "../../uiframework/data/runtime/TagRuntime";
import type { TagRuntimeApi } from "../../uiframework/data/runtime/TagRuntimeProxy";
import type { UiComponentDefinition, UiDocument, UiModal, UiNode } from "../../uiframework/core/document";
import type { NavigationTreeNode } from "../../uiframework/navigation/navigation";
import type { IntentCollector, IntentSource } from "../../execution";

export type MockScriptEvent = {
  projectId: string;
  pageId?: string | undefined;
  handlerId: string;
  sourceNodeId: string;
  eventName: string;
  payload?: Record<string, unknown> | undefined;
};

/** A concrete reusable-component instance with a scoped runtime node. */
export type MockRuntimeComponentScope = {
  instance: UiNode;
  definition: UiComponentDefinition;
  runtimeInstanceId: string;
};

export type MockScriptHost = {
  setNodeProp(nodeId: string, property: string, value: unknown): void;
  getNodeProps(nodeId: string): Record<string, unknown>;
  setNodeVariant(nodeId: string, variantName: string): void;
  getNodeVariant(nodeId: string): string | undefined;
  resolveUiNode(name: string): UiNode | undefined;
  resolveComponentDefinition(
    componentDefinitionId: string
  ): UiComponentDefinition | undefined;
  resolveComponentScopeForRuntimeNode(
    runtimeNodeId: string
  ): MockRuntimeComponentScope | undefined;
  getTagRuntime(): TagRuntime | undefined;
  getNavigationTree(): NavigationTreeNode[];
  getModals(): UiModal[];
  getDocument(): UiDocument | undefined;
  getActiveThemeId(): string | undefined;
  setTheme(themeId: string): void;
  navigateTo(path: string): void;
  emit(eventName: string, payload?: Record<string, unknown>): void;
};

export type UiComponentVariantScriptApi = {
  readonly current: string | undefined;
  [key: string]: unknown;
};

export type UiComponentScriptApi = {
  readonly id?: string;
  readonly name?: string;
  readonly type?: string;
  readonly variant?: UiComponentVariantScriptApi;
  setProp?(property: string, value: unknown): void;
  setColor?(color: string): void;
  [key: string]: unknown;
};

export type MockScriptUiApi = {
  get(name: string): UiComponentScriptApi;
  [key: string]: unknown;
};

export type MockScriptInternalApi = {
  get(name: string): UiComponentScriptApi;
  [key: string]: unknown;
};

export type MockScriptNavigationNodeApi = {
  readonly path: string;
  readonly pageId: string;
  go(): void;
  [key: string]: unknown;
};

export type MockScriptNavigationApi = {
  [key: string]: MockScriptNavigationNodeApi | unknown;
};

export type MockScriptInputsApi = Record<string, unknown>;

export type MockScriptModalApi = {
  open(payload?: Record<string, unknown>): void;
  close(payload?: Record<string, unknown>): void;
};

export type MockScriptModalsApi = Record<string, MockScriptModalApi>;

export type MockScriptAppApi = {
  theme: string;
  readonly themeId: string;
};

export type MockScriptContext = {
  projectId: string;
  handlerId: string;
  sourceNodeId: string;
  eventName: string;
  payload: Record<string, unknown>;
  state: {
    get<T>(key: string, fallback?: T): unknown | T;
    set(key: string, value: unknown): void;
    delete(key: string): void;
    clear(): void;
  };
  ui: MockScriptUiApi;
  nav: MockScriptNavigationApi;
  modals: MockScriptModalsApi;
  app: MockScriptAppApi;
  inputs?: MockScriptInputsApi | undefined;
  tags?: TagRuntimeApi | undefined;
  navigateTo(path: string): void;
  emit(eventName: string, payload?: Record<string, unknown>): void;
  random: {
    color(): string;
    number(min?: number, max?: number): number;
  };
  log(...args: unknown[]): void;
};

export type MockScriptExecutionEnvironment = {
  collector: IntentCollector;
  source: IntentSource;
};

export type CreateComponentApiOptions = {
  runtimeNodeId?: string;
  includePrivateMethods?: boolean;
};
