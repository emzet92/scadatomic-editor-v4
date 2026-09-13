import type { TagRuntime } from "../uiframework/data/runtime/TagRuntime";
import {
  createTagRuntimeGlobals,
  createTagRuntimeProxy,
  createUdtInstanceApi,
  type TagRuntimeApi,
} from "../uiframework/data/runtime/TagRuntimeProxy";
import { isTagRef } from "../uiframework/data/collections/TagRef";
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
import {
  Executor,
  ExecutionPlanner,
  IntentCollector,
  createIntentId,
  publishExecutionPlan,
  publishExecutionTrace,
  shadowKey,
  type Intent,
  type IntentSource,
  type RuntimeEffects,
} from "../execution";
import { TypeRegistry } from "../uiframework/data/types/TypeRegistry";

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
  getTagRuntime(): TagRuntime | undefined;
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

export type MockScriptInputsApi = Record<string, unknown>;

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
  /** Current reusable-component public inputs. TagRef inputs are live tag proxies. */
  inputs?: MockScriptInputsApi | undefined;
  /** Dynamic typed tag namespace. Writes are routed through the owning tag driver. */
  tags?: TagRuntimeApi | undefined;
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

type MockScriptExecutionEnvironment = {
  collector: IntentCollector;
  source: IntentSource;
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
  const collector = new IntentCollector();
  const source: IntentSource = {
    projectId: event.projectId,
    handlerId: event.handlerId,
    scriptId: event.handlerId,
    sourceNodeId: event.sourceNodeId,
    eventName: event.eventName,
  };
  const environment: MockScriptExecutionEnvironment = { collector, source };
  const ownerScope = host.resolveComponentScopeForRuntimeNode(event.sourceNodeId);
  const selfRef: { current: UiComponentScriptApi | undefined } = { current: undefined };
  const ctx = createContext(event, host, environment, () =>
    ownerScope && selfRef.current
      ? createInputsApi(ownerScope.definition, selfRef.current)
      : undefined
  );
  const self = ownerScope
    ? createComponentApi(
        ownerScope.instance,
        host,
        event.projectId,
        () => ctx,
        environment,
        {
          runtimeNodeId: ownerScope.runtimeInstanceId,
          includePrivateMethods: true,
        }
      )
    : undefined;
  selfRef.current = self;
  const internal = ownerScope
    ? createInternalUiApi(
        ownerScope.definition,
        ownerScope.runtimeInstanceId,
        host,
        event.projectId,
        () => ctx,
        environment
      )
    : undefined;

  try {
    executeSource({
      code: script.code,
      ctx,
      self,
      internal,
      args: [],
      globals: createTagGlobals(host, ctx, environment),
      sourceUrl: `scadatomic://${encodeURIComponent(event.projectId)}/scripts/${encodeURIComponent(event.handlerId)}.js`,
    });
  } catch (error) {
    collector.discard();
    console.error(
      `[mock-script-runtime] Handler ${event.handlerId} failed`,
      error
    );

    host.emit("script.error", {
      handlerId: event.handlerId,
      sourceNodeId: event.sourceNodeId,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  const intents = collector.takeIntents();
  let graph;
  try {
    const planner = new ExecutionPlanner();
    graph = planner.plan(intents, {
      source,
      validateIntent: (intent) => validateRuntimeIntent(intent, host),
    });
  } catch (error) {
    console.error(
      `[mock-script-runtime] Handler ${event.handlerId} planning failed`,
      error
    );
    host.emit("execution.planning-error", {
      handlerId: event.handlerId,
      sourceNodeId: event.sourceNodeId,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  const execution = {
    executionId: graph.executionId,
    projectId: event.projectId,
    handlerId: event.handlerId,
    eventName: event.eventName,
    sourceNodeId: event.sourceNodeId,
    scriptId: event.handlerId,
    intents,
    graph,
    createdAt: Date.now(),
  };

  // Freeze the exact planner output before the Executor is allowed to run.
  // The plan view therefore never confuses planned operations with results.
  publishExecutionPlan(execution);
  publishExecutionTrace(execution);
  void new Executor()
    .execute(graph, createRuntimeEffects(event, host))
    .then((result) => {
      publishExecutionTrace({ ...execution, result });
      if (result.status !== "success") {
        host.emit("execution.error", {
          handlerId: event.handlerId,
          sourceNodeId: event.sourceNodeId,
          executionId: graph.executionId,
          status: result.status,
        });
      }
    })
    .catch((error) => {
      console.error(
        `[mock-script-runtime] Execution ${graph.executionId} failed`,
        error
      );
      host.emit("execution.error", {
        handlerId: event.handlerId,
        sourceNodeId: event.sourceNodeId,
        executionId: graph.executionId,
        message: error instanceof Error ? error.message : String(error),
      });
    });
}

function createContext(
  event: MockScriptEvent,
  host: MockScriptHost,
  environment: MockScriptExecutionEnvironment,
  getInputs?: () => MockScriptInputsApi | undefined
): MockScriptContext {
  const ui = createUiApi(host, event.projectId, () => ctx, environment);
  const nav = createNavigationApi(host, environment);
  const tagRuntime = host.getTagRuntime();
  const contextRef: { current?: MockScriptContext } = {};
  const stateWrites = new Map<string, { deleted: boolean; value?: unknown }>();
  let stateCleared = false;
  const tags = tagRuntime
    ? createTagRuntimeProxy(tagRuntime, createTagRuntimeContext(environment, () => contextRef.current))
    : undefined;

  const ctx: MockScriptContext = Object.freeze({
    projectId: event.projectId,
    handlerId: event.handlerId,
    sourceNodeId: event.sourceNodeId,
    eventName: event.eventName,
    payload: Object.freeze({ ...(event.payload ?? {}) }),
    get inputs() {
      return getInputs?.();
    },
    state: Object.freeze({
      get<T>(key: string, fallback?: T) {
        const local = stateWrites.get(key);
        if (local) return local.deleted ? fallback : local.value;
        if (stateCleared) return fallback;
        return getMockSessionValue(event.projectId, key, fallback);
      },
      set(key: string, value: unknown) {
        stateWrites.set(key, { deleted: false, value });
        environment.collector.setShadow(shadowKey.state(event.projectId, key), value);
        environment.collector.push({
          id: createIntentId(),
          type: "state-set",
          source: environment.source,
          key,
          value,
        });
      },
      delete(key: string) {
        stateWrites.set(key, { deleted: true });
        environment.collector.deleteShadow(shadowKey.state(event.projectId, key));
        environment.collector.push({
          id: createIntentId(),
          type: "state-delete",
          source: environment.source,
          key,
        });
      },
      clear() {
        stateCleared = true;
        stateWrites.clear();
        environment.collector.clearShadow(`state:${event.projectId}:`);
        environment.collector.push({
          id: createIntentId(),
          type: "state-clear",
          source: environment.source,
        });
      },
    }),
    ui,
    nav,
    ...(tags ? { tags } : {}),
    navigateTo(path: string) {
      environment.collector.push({
        id: createIntentId(),
        type: "navigate",
        source: environment.source,
        path,
      });
    },
    emit(eventName: string, payload?: Record<string, unknown>) {
      environment.collector.push({
        id: createIntentId(),
        type: "emit-event",
        source: environment.source,
        event: {
          kind: "event",
          ownerId: event.sourceNodeId,
          eventName,
        },
        ...(payload ? { payload } : {}),
      });
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
  contextRef.current = ctx;

  return ctx;
}

function createInputsApi(
  definition: UiComponentDefinition,
  self: UiComponentScriptApi
): MockScriptInputsApi {
  const inputNames = new Set(Object.keys(definition.inputs ?? {}));
  return new Proxy({} as MockScriptInputsApi, {
    get(_target, property) {
      return typeof property === "string" && inputNames.has(property)
        ? self[property]
        : undefined;
    },
    set(_target, property, value) {
      if (typeof property !== "string" || !inputNames.has(property)) return false;
      self[property] = value;
      return true;
    },
    ownKeys() {
      return [...inputNames];
    },
    getOwnPropertyDescriptor() {
      return { enumerable: true, configurable: true };
    },
  });
}

function createNavigationApi(
  host: MockScriptHost,
  environment: MockScriptExecutionEnvironment
): MockScriptNavigationApi {
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
        environment.collector.push({
          id: createIntentId(),
          type: "navigate",
          source: environment.source,
          path: node.path,
        });
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
  getContext: () => MockScriptContext,
  environment: MockScriptExecutionEnvironment
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

    const api = createComponentApi(
      node,
      host,
      projectId,
      getContext,
      environment
    );
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
  getContext: () => MockScriptContext,
  environment: MockScriptExecutionEnvironment
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
    const api = createComponentApi(
      node,
      host,
      projectId,
      getContext,
      environment,
      { runtimeNodeId }
    );
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
  environment: MockScriptExecutionEnvironment,
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
    environment.collector.setShadow(
      shadowKey.componentProperty(runtimeNodeId, property),
      value
    );
    environment.collector.push({
      id: createIntentId(),
      type: "set-property",
      source: environment.source,
      target: {
        kind: "component-property",
        componentId: runtimeNodeId,
        property,
        path: `${node.name}.${property}`,
      },
      value,
    });
  }

  function getInternalApi() {
    if (!reusableDefinition) return undefined;
    internalApi ??= createInternalUiApi(
      reusableDefinition,
      runtimeNodeId,
      host,
      projectId,
      getContext,
      environment
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
      environment.collector.push({
        id: createIntentId(),
        type: "call-method",
        source: environment.source,
        target: {
          kind: "method",
          ownerId: runtimeNodeId,
          method: methodName,
          path: node.name,
        },
        args,
        expanded: true,
      });
      const script = getMockScript(projectId, methodRef.scriptId);
      const baseContext = getContext();
      const executionContext = reusableDefinition
        ? Object.freeze({
            ...baseContext,
            inputs: createInputsApi(reusableDefinition, componentSelfProxy),
          })
        : baseContext;
      return executeSource({
        code: script.code,
        ctx: executionContext,
        self: reusableDefinition ? componentSelfProxy : publicProxy,
        internal: getInternalApi(),
        args,
        globals: createTagGlobals(host, executionContext, environment),
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

    environment.collector.setShadow(
      shadowKey.componentVariant(variantRuntimeNodeId),
      variantName
    );
    environment.collector.push({
      id: createIntentId(),
      type: "set-variant",
      source: environment.source,
      target: {
        kind: "component-variant",
        componentId: variantRuntimeNodeId,
        path: `${node.name}.variant`,
      },
      variantName,
    });
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
        if (allowedProps.has(property)) {
          const input = reusableDefinition?.inputs?.[property];
          const value = localProps[property];
          if (input?.type === "tagRef" && isTagRef(value)) {
            const tagRuntime = host.getTagRuntime();
            const tag = tagRuntime?.listTags().find((candidate) => candidate.id === value.tagId);
            if (!tagRuntime || !tag || tag.type.kind !== "udt" || tag.type.udtId !== input.udtId) {
              return undefined;
            }
            return createUdtInstanceApi(tag.name, tagRuntime, {
              ...createTagRuntimeContext(environment, getContext),
            });
          }
          return value;
        }
        return getMethod(property, includePrivateMethods);
      },
      set(_apiTarget, property, value) {
        if (typeof property !== "string") return false;
        setProp(property, value);
        return true;
      },
    }) as UiComponentScriptApi;
  }

  const publicProxy = makeProxy(false);
  const componentSelfProxy = reusableDefinition ? makeProxy(true) : publicProxy;
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
  globals = {},
  sourceUrl,
}: {
  code: string;
  ctx: MockScriptContext;
  self: UiComponentScriptApi | undefined;
  internal?: MockScriptInternalApi | undefined;
  args: unknown[];
  globals?: Record<string, unknown> | undefined;
  sourceUrl: string;
}) {
  const reserved = new Set(["ctx", "self", "internal", "args"]);
  const globalEntries = Object.entries(globals).filter(
    ([name]) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) && !reserved.has(name)
  );
  const globalNames = globalEntries.map(([name]) => name);
  const globalValues = globalEntries.map(([, value]) => value);

  if (internal) {
    const execute = new Function(
      "ctx",
      "self",
      "internal",
      "args",
      ...globalNames,
      `"use strict";\n${code}\n//# sourceURL=${sourceUrl}`
    ) as (...values: unknown[]) => unknown;

    return execute(ctx, self, internal, args, ...globalValues);
  }

  const execute = new Function(
    "ctx",
    "self",
    "args",
    ...globalNames,
    `"use strict";\n${code}\n//# sourceURL=${sourceUrl}`
  ) as (...values: unknown[]) => unknown;

  return execute(ctx, self, args, ...globalValues);
}

function createTagGlobals(
  host: MockScriptHost,
  ctx: MockScriptContext,
  environment: MockScriptExecutionEnvironment
) {
  const tagRuntime = host.getTagRuntime();
  return tagRuntime
    ? createTagRuntimeGlobals(
        tagRuntime,
        createTagRuntimeContext(environment, () => ctx)
      )
    : {};
}

function createTagRuntimeContext(
  environment: MockScriptExecutionEnvironment,
  getContext: () => MockScriptContext | undefined
) {
  return {
    writeSource: { kind: "script" } as const,
    log: (...values: unknown[]) => getContext()?.log(...values),
    emit: (eventName: string, payload?: Record<string, unknown>) =>
      getContext()?.emit(eventName, payload),
    readValue: (path: string, fallback: () => unknown) =>
      environment.collector.readShadow(shadowKey.tag(path), fallback),
    writeValue: (path: string, tagId: string, value: unknown) => {
      environment.collector.setShadow(shadowKey.tag(path), value);
      environment.collector.push({
        id: createIntentId(),
        type: "set-value",
        source: environment.source,
        target: {
          kind: "tag",
          id: tagId,
          path,
        },
        value,
      });
    },
    callMethod: (path: string, tagId: string, methodName: string, args: unknown[]) => {
      environment.collector.push({
        id: createIntentId(),
        type: "call-method",
        source: environment.source,
        target: {
          kind: "method",
          ownerId: tagId,
          method: methodName,
          path,
        },
        args,
        expanded: true,
      });
    },
  };
}

function createRuntimeEffects(
  event: MockScriptEvent,
  host: MockScriptHost
): RuntimeEffects {
  return {
    setValue(target, value) {
      const tagRuntime = host.getTagRuntime();
      if (!tagRuntime) {
        throw new Error(`Tag runtime is unavailable for ${target.path}.`);
      }
      const owner = tagRuntime.listTags().find((tag) => tag.id === target.id);
      if (!owner) {
        throw new Error(`Tag ${target.id} no longer exists (${target.path}).`);
      }
      const result = tagRuntime.write(target.path, value, { kind: "script" });
      if (!result.ok) throw new TypeError(result.error);
    },
    setProperty(target, value) {
      host.setNodeProp(target.componentId, target.property, value);
    },
    setVariant(target, variantName) {
      host.setNodeVariant(target.componentId, variantName);
    },
    emitEvent(intentEvent, payload) {
      host.emit(intentEvent.eventName, payload);
    },
    navigate(path) {
      host.navigateTo(path);
    },
    setState(key, value) {
      setMockSessionValue(event.projectId, key, value);
    },
    deleteState(key) {
      deleteMockSessionValue(event.projectId, key);
    },
    clearState() {
      clearMockSessionState(event.projectId);
    },
    callMethod(target) {
      throw new Error(
        `Deferred runtime method execution is not registered: ${target.path ?? target.ownerId}.${target.method}`
      );
    },
  };
}

function validateRuntimeIntent(intent: Intent, host: MockScriptHost): void {
  if (intent.type !== "set-value") return;

  const tagRuntime = host.getTagRuntime();
  if (!tagRuntime) {
    throw new TypeError(`Tag runtime is unavailable for ${intent.target.path}.`);
  }

  const resolved = tagRuntime.store.resolve(intent.target.path);
  if (!resolved) {
    throw new TypeError(`Unknown tag path: ${intent.target.path}`);
  }
  if (resolved.tag.id !== intent.target.id) {
    throw new TypeError(
      `Tag reference changed before execution: ${intent.target.path}.`
    );
  }
  if (resolved.type.kind === "udt") {
    throw new TypeError(`Cannot assign an entire UDT value: ${intent.target.path}`);
  }
  if (!TypeRegistry.validate(resolved.type, intent.value)) {
    throw new TypeError(
      `Invalid ${TypeRegistry.getDisplayName(resolved.type)} value for ${intent.target.path}.`
    );
  }
}

function hasOwn(target: object, property: string) {
  return Object.prototype.hasOwnProperty.call(target, property);
}

function randomColor() {
  const value = Math.floor(Math.random() * 0x1000000);
  return `#${value.toString(16).padStart(6, "0")}`;
}
