import type { UiComponentDefinition, UiNode } from "../uiframework/core/document";
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
  handlerId: string;
  sourceNodeId: string;
  eventName: string;
  payload?: Record<string, unknown> | undefined;
};

export type MockScriptHost = {
  setNodeProp(nodeId: string, property: string, value: unknown): void;
  setNodeVariant(nodeId: string, variantName: string): void;
  getNodeVariant(nodeId: string): string | undefined;
  resolveUiNode(name: string): UiNode | undefined;
  resolveComponentDefinition(
    componentDefinitionId: string
  ): UiComponentDefinition | undefined;
  emit(eventName: string, payload?: Record<string, unknown>): void;
};

export type UiComponentVariantScriptApi = {
  readonly current: string | undefined;
  [key: string]: unknown;
};

export type UiComponentScriptApi = {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly variant?: UiComponentVariantScriptApi;
  setProp(property: string, value: unknown): void;
  setColor(color: string): void;
  [key: string]: unknown;
};

export type MockScriptUiApi = {
  get(name: string): UiComponentScriptApi;
  setProp(nodeId: string, property: string, value: unknown): void;
  setColor(nodeId: string, color: string): void;
  [key: string]: unknown;
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
  emit(eventName: string, payload?: Record<string, unknown>): void;
  random: {
    color(): string;
    number(min?: number, max?: number): number;
  };
  log(...args: unknown[]): void;
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

  try {
    executeSource({
      code: script.code,
      ctx,
      self: undefined,
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

function createUiApi(
  host: MockScriptHost,
  projectId: string,
  getContext: () => MockScriptContext
): MockScriptUiApi {
  const componentCache = new Map<string, UiComponentScriptApi>();

  const baseApi = {
    get(name: string) {
      return resolveComponent(name);
    },
    setProp(nodeId: string, property: string, value: unknown) {
      host.setNodeProp(nodeId, property, value);
    },
    setColor(nodeId: string, color: string) {
      host.setNodeProp(nodeId, "backgroundColor", color);
    },
  };

  function resolveComponent(name: string): UiComponentScriptApi {
    const cached = componentCache.get(name);
    if (cached) {
      return cached;
    }

    const node = host.resolveUiNode(name);
    if (!node) {
      throw new Error(`Unknown UI component: ${name}`);
    }

    const api = createComponentApi(node, host, projectId, getContext);
    componentCache.set(name, api);
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

function createComponentApi(
  node: UiNode,
  host: MockScriptHost,
  projectId: string,
  getContext: () => MockScriptContext
): UiComponentScriptApi {
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
      }
    : getResolvedComponentProps(node);
  const colorProperty = reusableDefinition
    ? Object.entries(reusableDefinition.inputs ?? {}).find(
        ([, input]) => input.type === "color"
      )?.[0]
    : getComponentColorProperty(node);
  const methodCache = new Map<string, (...args: unknown[]) => unknown>();
  const variantNames = reusableDefinition ? [] : getComponentVariantNames(node);
  const localWrites = new Map<string, unknown>();
  const storedVariant = reusableDefinition ? undefined : host.getNodeVariant(node.id);
  let localVariant =
    !reusableDefinition && storedVariant && node.variants?.[storedVariant]
      ? storedVariant
      : node.defaultVariant;

  let proxy: UiComponentScriptApi;
  let componentSelfProxy: UiComponentScriptApi;

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
    host.setNodeProp(node.id, property, value);
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
        self: reusableDefinition ? componentSelfProxy : proxy,
        args,
        sourceUrl: `scadatomic://${encodeURIComponent(projectId)}/methods/${encodeURIComponent(node.name)}.${encodeURIComponent(methodName)}.js`,
      });
    };

    methodCache.set(cacheKey, callable);
    return callable;
  }

  function setVariant(variantName: string) {
    if (!node.variants?.[variantName]) {
      throw new Error(`${node.name} (${node.type}) has no variant “${variantName}”.`);
    }

    localVariant = variantName;
    Object.assign(localProps, getComponentVariantProps(node, variantName));
    for (const [property, value] of localWrites) localProps[property] = value;
    host.setNodeVariant(node.id, variantName);
  }

  const variantApi =
    variantNames.length > 0
      ? createVariantApi({
          variantNames,
          getCurrent: () => localVariant,
          setVariant,
        })
      : undefined;

  const target = {
    id: node.id,
    name: node.name,
    type: reusableDefinition?.name ?? node.type,
    ...(variantApi ? { variant: variantApi } : {}),
    setProp,
    setColor(color: string) {
      if (!colorProperty) {
        throw new Error(
          `${node.name} (${reusableDefinition?.name ?? node.type}) has no public color property.`
        );
      }
      setProp(colorProperty, color);
    },
  } as UiComponentScriptApi;

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

  proxy = makeProxy(false);
  componentSelfProxy = reusableDefinition ? makeProxy(true) : proxy;
  return proxy;
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

      if (!variantNames.includes(property)) {
        return undefined;
      }

      const cached = methods.get(property);
      if (cached) {
        return cached;
      }

      // Every generated variant method is only syntactic sugar over the
      // component-level setVariant(). The Proxy decides the variant name.
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
  args,
  sourceUrl,
}: {
  code: string;
  ctx: MockScriptContext;
  self: UiComponentScriptApi | undefined;
  args: unknown[];
  sourceUrl: string;
}) {
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
