import type { UiComponentDefinition, UiNode } from "../uiframework/core/document";
import type { NavigationTreeNode } from "../uiframework/navigation/navigation";
import {
  getComponentApiMethodNames,
  getComponentApiPropertyNames,
  getComponentColorProperty,
  getResolvedComponentProps,
} from "../uiframework/component-api";
import {
  getComponentVariantNames,
  getComponentVariantProps,
} from "../uiframework/component-variants";
import { getMockScript } from "./mock-script-store";
import {
  clearMockSessionState,
  deleteMockSessionValue,
  getMockSessionValue,
  setMockSessionValue,
} from "./mock-session-state";

export type MockScriptEvent = {
  projectId: string;
  pageId?: string | undefined;
  handlerId: string;
  sourceNodeId: string;
  eventName: string;
  payload?: Record<string, unknown> | undefined;
};

/**
 * A concrete reusable-component instance that owns a scoped runtime node.
 * runtimeInstanceId is cumulative for nested user components, e.g.
 * "PumpCard1::AlarmBadge1".
 */
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
  getNavigationTree(): NavigationTreeNode[];
  navigateTo(path: string): void;
  emit(eventName: string, payload?: Record<string, unknown>): void;
};

export type UiComponentVariantScriptApi = {
  readonly current: string | undefined;
  [key: string]: unknown;
};

export type UiComponentScriptApi = {
  /** Framework metadata/helpers exist on primitive nodes only. */
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

/** Private component-definition tree, injected only into component-owned code. */
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
  /** Public API of components on the current runtime page. */
  ui: MockScriptUiApi;
  nav: MockScriptNavigationApi;
  navigateTo(path: string): void;
  emit(eventName: string, payload?: Record<string, unknown>): void;
  random: {
    color(): string;
    number(min?: number, max?: number): number;
  };
  log(...args: unknown[]): void;
};

type CreateComponentApiOptions = {
  /** Runtime identity used for scoped props/variants. Defaults to node.id. */
  runtimeNodeId?: string;
  /** Component-owned scripts receive private methods through self. */
  includePrivateMethods?: boolean;
};

/**
 * Prototype-only JavaScript execution.
 *
 * This deliberately executes trusted local developer code with new Function.
 * It is not a sandbox and must not be used for untrusted production scripts.
 */
export function executeMockScript(
  event: MockScriptEvent,
  host: MockScriptHost
): void {
  const script = getMockScript(event.projectId, event.handlerId);
  const ctx = createContext(event, host);
  const ownerScope = host.resolveComponentScopeForRuntimeNode(event.sourceNodeId);
  const self = ownerScope
    ? createComponentApi(
        ownerScope.instance,
        host,
        event.projectId,
        () => ctx,
        {
          runtimeNodeId: ownerScope.runtimeInstanceId,
          includePrivateMethods: true,
        }
      )
    : undefined;
  const internal = ownerScope
    ? createInternalUiApi(
        ownerScope.definition,
        ownerScope.runtimeInstanceId,
        host,
        event.projectId,
        () => ctx
      )
    : undefined;

  try {
    executeSource({
      code: script.code,
      ctx,
      self,
      internal,
      args: [],
      sourceUrl: `scadatomic://${encodeURIComponent(event.projectId)}/scripts/${encodeURIComponent(event.handlerId)}.js`,
    });
  } catch (error) {
    console.error(
      `[mock-script-runtime] Handler ${event.handlerId} failed`,
      error
    );

    host.emit("script.error", {
      handlerId: event.handlerId,
      sourceNodeId: event.sourceNodeId,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function createContext(
  event: MockScriptEvent,
  host: MockScriptHost
): MockScriptContext {
  let ctx: MockScriptContext;
  const ui = createUiApi(host, event.projectId, () => ctx);
  const nav = createNavigationApi(host);

  ctx = Object.freeze({
    projectId: event.projectId,
    handlerId: event.handlerId,
    sourceNodeId: event.sourceNodeId,
    eventName: event.eventName,
    payload: Object.freeze({ ...(event.payload ?? {}) }),
    state: Object.freeze({
      get<T>(key: string, fallback?: T) {
        return getMockSessionValue(event.projectId, key, fallback);
      },
      set(key: string, value: unknown) {
        setMockSessionValue(event.projectId, key, value);
      },
      delete(key: string) {
        deleteMockSessionValue(event.projectId, key);
      },
      clear() {
        clearMockSessionState(event.projectId);
      },
    }),
    ui,
    nav,
    navigateTo(path: string) {
      host.navigateTo(path);
    },
    emit(eventName: string, payload?: Record<string, unknown>) {
      host.emit(eventName, payload);
    },
    random: Object.freeze({
      color: randomColor,
      number(min = 0, max = 1) {
        const low = Math.min(min, max);
        const high = Math.max(min, max);
        return low + Math.random() * (high - low);
      },
    }),
    log(...args: unknown[]) {
      console.log(`[script:${event.handlerId}]`, ...args);
    },
  });

  return ctx;
}

function createNavigationApi(host: MockScriptHost): MockScriptNavigationApi {
  const roots = host.getNavigationTree();
  const rootByName = new Map(roots.map((node) => [node.name, node]));
  const cache = new Map<string, MockScriptNavigationNodeApi>();

  function createNodeApi(node: NavigationTreeNode): MockScriptNavigationNodeApi {
    const cached = cache.get(node.pageId);
    if (cached) return cached;

    const childByName = new Map(node.children.map((child) => [child.name, child]));
    const target = {
      path: node.path,
      pageId: node.pageId,
      go() {
        host.navigateTo(node.path);
      },
    } as MockScriptNavigationNodeApi;

    const proxy = new Proxy(target, {
      get(apiTarget, property, receiver) {
        if (typeof property !== "string" || hasOwn(apiTarget, property)) {
          return Reflect.get(apiTarget, property, receiver);
        }
        const child = childByName.get(property);
        return child ? createNodeApi(child) : undefined;
      },
    });

    cache.set(node.pageId, proxy);
    return proxy;
  }

  return new Proxy({} as MockScriptNavigationApi, {
    get(_target, property) {
      if (typeof property !== "string") return undefined;
      const node = rootByName.get(property);
      return node ? createNodeApi(node) : undefined;
    },
  });
}

/** Public scene facade. Reusable components expose public inputs/methods only. */
function createUiApi(
  host: MockScriptHost,
  projectId: string,
  getContext: () => MockScriptContext
): MockScriptUiApi {
  // Names are only API aliases. Stable node ids are the actual identity, so
  // Button1 on a page and Button1 inside a component never share a cache slot.
  const componentCache = new Map<string, UiComponentScriptApi>();

  const baseApi = {
    get(name: string) {
      return resolveComponent(name);
    },
  };

  function resolveComponent(name: string): UiComponentScriptApi {
    const node = host.resolveUiNode(name);
    if (!node) throw new Error(`Unknown UI component on current scene: ${name}`);

    const cached = componentCache.get(node.id);
    if (cached) return cached;

    const api = createComponentApi(node, host, projectId, getContext);
    componentCache.set(node.id, api);
    return api;
  }

  return new Proxy(baseApi as MockScriptUiApi, {
    get(target, property, receiver) {
      if (typeof property !== "string" || hasOwn(target, property)) {
        return Reflect.get(target, property, receiver);
      }

      return resolveComponent(property);
    },
  });
}

/**
 * Private facade for a reusable component definition.
 *
 * It contains only nodes physically owned by this definition. Nested reusable
 * components are deliberately represented by their PUBLIC facade, so a parent
 * component cannot pierce the private tree of a child component.
 */
function createInternalUiApi(
  definition: UiComponentDefinition,
  runtimeInstanceId: string,
  host: MockScriptHost,
  projectId: string,
  getContext: () => MockScriptContext
): MockScriptInternalApi {
  const nodesByName = new Map<string, UiNode>();
  const duplicateNames = new Set<string>();
  const cache = new Map<string, UiComponentScriptApi>();

  for (const node of Object.values(definition.nodes)) {
    if (nodesByName.has(node.name)) duplicateNames.add(node.name);
    else nodesByName.set(node.name, node);
  }

  function resolveInternal(name: string): UiComponentScriptApi {
    if (duplicateNames.has(name)) {
      throw new Error(
        `Ambiguous internal component name “${name}” in ${definition.name}. Rename internal nodes to unique API names.`
      );
    }

    const node = nodesByName.get(name);
    if (!node) {
      throw new Error(
        `Unknown internal component: ${definition.name}.${name}`
      );
    }

    const cached = cache.get(node.id);
    if (cached) return cached;

    const runtimeNodeId = `${runtimeInstanceId}::${node.id}`;
    const api = createComponentApi(node, host, projectId, getContext, {
      runtimeNodeId,
    });
    cache.set(node.id, api);
    return api;
  }

  const baseApi = {
    get(name: string) {
      return resolveInternal(name);
    },
  } as MockScriptInternalApi;

  return new Proxy(baseApi, {
    get(target, property, receiver) {
      if (typeof property !== "string" || hasOwn(target, property)) {
        return Reflect.get(target, property, receiver);
      }
      return resolveInternal(property);
    },
  });
}

function createComponentApi(
  node: UiNode,
  host: MockScriptHost,
  projectId: string,
  getContext: () => MockScriptContext,
  options: CreateComponentApiOptions = {}
): UiComponentScriptApi {
  const runtimeNodeId = options.runtimeNodeId ?? node.id;
  const reusableDefinition = node.componentDefinitionId
    ? host.resolveComponentDefinition(node.componentDefinitionId)
    : undefined;
  const allowedProps = new Set(
    reusableDefinition
      ? Object.keys(reusableDefinition.inputs ?? {})
      : getComponentApiPropertyNames(node)
  );
  const publicMethods = reusableDefinition
    ? Object.entries(reusableDefinition.methods ?? {})
        .filter(([, method]) => method.visibility === "public")
        .map(([name]) => name)
    : getComponentApiMethodNames(node);
  const allMethods = reusableDefinition
    ? Object.keys(reusableDefinition.methods ?? {})
    : publicMethods;
  const allowedMethods = new Set(publicMethods);
  const allMethodNames = new Set(allMethods);
  const localProps = reusableDefinition
    ? {
        ...Object.fromEntries(
          Object.entries(reusableDefinition.inputs ?? {}).map(([name, input]) => [
            name,
            input.defaultValue,
          ])
        ),
        ...(node.props ?? {}),
        ...host.getNodeProps(runtimeNodeId),
      }
    : {
        ...getResolvedComponentProps(node),
        ...host.getNodeProps(runtimeNodeId),
      };
  const colorProperty = reusableDefinition
    ? Object.entries(reusableDefinition.inputs ?? {}).find(
        ([, input]) => input.type === "color"
      )?.[0]
    : getComponentColorProperty(node);
  const methodCache = new Map<string, (...args: unknown[]) => unknown>();
  const variantSource = reusableDefinition?.nodes[reusableDefinition.rootId] ?? node;
  const variantNames = getComponentVariantNames(variantSource);
  const variantRuntimeNodeId = reusableDefinition
    ? `${runtimeNodeId}::${variantSource.id}`
    : runtimeNodeId;
  const localWrites = new Map<string, unknown>();
  const storedVariant = host.getNodeVariant(variantRuntimeNodeId);
  let localVariant =
    storedVariant && variantSource.variants?.[storedVariant]
      ? storedVariant
      : variantSource.defaultVariant;

  let publicProxy: UiComponentScriptApi;
  let componentSelfProxy: UiComponentScriptApi;
  let internalApi: MockScriptInternalApi | undefined;

  function setProp(property: string, value: unknown) {
    if (!allowedProps.has(property)) {
      throw new Error(
        `${node.name} (${reusableDefinition?.name ?? node.type}) has no public property “${property}”. Available: ${[
          ...allowedProps,
        ].join(", ")}`
      );
    }

    localProps[property] = value;
    localWrites.set(property, value);
    host.setNodeProp(runtimeNodeId, property, value);
  }

  function getInternalApi() {
    if (!reusableDefinition) return undefined;
    internalApi ??= createInternalUiApi(
      reusableDefinition,
      runtimeNodeId,
      host,
      projectId,
      getContext
    );
    return internalApi;
  }

  function getMethod(methodName: string, allowPrivate: boolean) {
    if (!allowPrivate && !allowedMethods.has(methodName)) return undefined;
    if (allowPrivate && !allMethodNames.has(methodName)) return undefined;

    const cacheKey = `${allowPrivate ? "all" : "public"}:${methodName}`;
    const cached = methodCache.get(cacheKey);
    if (cached) return cached;

    const methodRef = reusableDefinition
      ? reusableDefinition.methods?.[methodName]
      : node.methods?.[methodName];
    if (!methodRef) return undefined;

    const callable = (...args: unknown[]) => {
      const script = getMockScript(projectId, methodRef.scriptId);
      return executeSource({
        code: script.code,
        ctx: getContext(),
        self: reusableDefinition ? componentSelfProxy : publicProxy,
        internal: getInternalApi(),
        args,
        sourceUrl: `scadatomic://${encodeURIComponent(projectId)}/methods/${encodeURIComponent(node.name)}.${encodeURIComponent(methodName)}.js`,
      });
    };

    methodCache.set(cacheKey, callable);
    return callable;
  }

  function setVariant(variantName: string) {
    if (!variantSource.variants?.[variantName]) {
      throw new Error(
        `${node.name} (${reusableDefinition?.name ?? node.type}) has no variant “${variantName}”.`
      );
    }

    localVariant = variantName;

    if (!reusableDefinition) {
      Object.assign(localProps, getComponentVariantProps(variantSource, variantName));
      for (const [property, value] of localWrites) localProps[property] = value;
    }

    host.setNodeVariant(variantRuntimeNodeId, variantName);
  }

  const variantApi =
    variantNames.length > 0
      ? createVariantApi({
          variantNames,
          getCurrent: () => localVariant,
          setVariant,
        })
      : undefined;

  // Reusable components are strict facades: only explicitly declared inputs,
  // public methods and variants are visible externally. Primitive nodes keep
  // framework metadata/helpers for low-level component scripting.
  const target = reusableDefinition
    ? ({
        ...(variantApi ? { variant: variantApi } : {}),
      } as UiComponentScriptApi)
    : ({
        id: runtimeNodeId,
        name: node.name,
        type: node.type,
        ...(variantApi ? { variant: variantApi } : {}),
        setProp,
        setColor(color: string) {
          if (!colorProperty) {
            throw new Error(
              `${node.name} (${node.type}) has no color property.`
            );
          }
          setProp(colorProperty, color);
        },
      } as UiComponentScriptApi);

  function makeProxy(includePrivateMethods: boolean) {
    return new Proxy(target, {
      get(apiTarget, property, receiver) {
        if (typeof property !== "string" || hasOwn(apiTarget, property)) {
          return Reflect.get(apiTarget, property, receiver);
        }
        if (allowedProps.has(property)) return localProps[property];
        return getMethod(property, includePrivateMethods);
      },
      set(_apiTarget, property, value) {
        if (typeof property !== "string") return false;
        setProp(property, value);
        return true;
      },
    }) as UiComponentScriptApi;
  }

  publicProxy = makeProxy(false);
  componentSelfProxy = reusableDefinition ? makeProxy(true) : publicProxy;
  return options.includePrivateMethods ? componentSelfProxy : publicProxy;
}

function createVariantApi({
  variantNames,
  getCurrent,
  setVariant,
}: {
  variantNames: string[];
  getCurrent: () => string | undefined;
  setVariant: (variantName: string) => void;
}): UiComponentVariantScriptApi {
  const methods = new Map<string, () => void>();

  const target = {
    get current() {
      return getCurrent();
    },
  } as UiComponentVariantScriptApi;

  return new Proxy(target, {
    get(apiTarget, property, receiver) {
      if (typeof property !== "string" || hasOwn(apiTarget, property)) {
        return Reflect.get(apiTarget, property, receiver);
      }

      if (!variantNames.includes(property)) return undefined;

      const cached = methods.get(property);
      if (cached) return cached;

      const callable = () => {
        setVariant(property);
      };

      methods.set(property, callable);
      return callable;
    },
  });
}

function executeSource({
  code,
  ctx,
  self,
  internal,
  args,
  sourceUrl,
}: {
  code: string;
  ctx: MockScriptContext;
  self: UiComponentScriptApi | undefined;
  internal?: MockScriptInternalApi | undefined;
  args: unknown[];
  sourceUrl: string;
}) {
  if (internal) {
    const execute = new Function(
      "ctx",
      "self",
      "internal",
      "args",
      `"use strict";\n${code}\n//# sourceURL=${sourceUrl}`
    ) as (
      context: MockScriptContext,
      self: UiComponentScriptApi | undefined,
      internal: MockScriptInternalApi,
      args: unknown[]
    ) => unknown;

    return execute(ctx, self, internal, args);
  }

  const execute = new Function(
    "ctx",
    "self",
    "args",
    `"use strict";\n${code}\n//# sourceURL=${sourceUrl}`
  ) as (
    context: MockScriptContext,
    self: UiComponentScriptApi | undefined,
    args: unknown[]
  ) => unknown;

  return execute(ctx, self, args);
}

function hasOwn(target: object, property: string) {
  return Object.prototype.hasOwnProperty.call(target, property);
}

function randomColor() {
  const value = Math.floor(Math.random() * 0x1000000);
  return `#${value.toString(16).padStart(6, "0")}`;
}
