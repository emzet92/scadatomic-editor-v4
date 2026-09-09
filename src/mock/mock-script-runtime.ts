import type { UiNode } from "../uiframework/core/document";
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
  const allowedProps = new Set(getComponentApiPropertyNames(node));
  const allowedMethods = new Set(getComponentApiMethodNames(node));
  const localProps = getResolvedComponentProps(node);
  const colorProperty = getComponentColorProperty(node);
  const methodCache = new Map<string, (...args: unknown[]) => unknown>();
  const variantNames = getComponentVariantNames(node);
  const localWrites = new Map<string, unknown>();
  const storedVariant = host.getNodeVariant(node.id);
  let localVariant =
    storedVariant && node.variants?.[storedVariant]
      ? storedVariant
      : node.defaultVariant;

  let proxy: UiComponentScriptApi;

  function setProp(property: string, value: unknown) {
    if (!allowedProps.has(property)) {
      throw new Error(
        `${node.name} (${node.type}) has no property “${property}”. Available: ${[
          ...allowedProps,
        ].join(", ")}`
      );
    }

    localProps[property] = value;
    localWrites.set(property, value);
    host.setNodeProp(node.id, property, value);
  }

  function getMethod(methodName: string) {
    const cached = methodCache.get(methodName);
    if (cached) {
      return cached;
    }

    const methodRef = node.methods?.[methodName];
    if (!methodRef) {
      return undefined;
    }

    const callable = (...args: unknown[]) => {
      const script = getMockScript(projectId, methodRef.scriptId);

      return executeSource({
        code: script.code,
        ctx: getContext(),
        self: proxy,
        args,
        sourceUrl: `scadatomic://${encodeURIComponent(projectId)}/methods/${encodeURIComponent(node.name)}.${encodeURIComponent(methodName)}.js`,
      });
    };

    methodCache.set(methodName, callable);
    return callable;
  }

  const variantApi =
    variantNames.length > 0
      ? createVariantApi({
          node,
          variantNames,
          getCurrent: () => localVariant,
          selectVariant(variantName) {
            localVariant = variantName;

            Object.assign(
              localProps,
              getComponentVariantProps(node, variantName)
            );

            for (const [property, value] of localWrites) {
              localProps[property] = value;
            }

            host.setNodeVariant(node.id, variantName);
          },
        })
      : undefined;

  const target = {
    id: node.id,
    name: node.name,
    type: node.type,
    ...(variantApi ? { variant: variantApi } : {}),
    setProp,
    setColor(color: string) {
      if (!colorProperty) {
        throw new Error(`${node.name} (${node.type}) has no color property.`);
      }

      setProp(colorProperty, color);
    },
  } as UiComponentScriptApi;

  proxy = new Proxy(target, {
    get(apiTarget, property, receiver) {
      if (typeof property !== "string" || hasOwn(apiTarget, property)) {
        return Reflect.get(apiTarget, property, receiver);
      }

      if (allowedProps.has(property)) {
        return localProps[property];
      }

      if (allowedMethods.has(property)) {
        return getMethod(property);
      }

      return undefined;
    },
    set(_apiTarget, property, value) {
      if (typeof property !== "string") {
        return false;
      }

      setProp(property, value);
      return true;
    },
  });

  return proxy;
}

function createVariantApi({
  node,
  variantNames,
  getCurrent,
  selectVariant,
}: {
  node: UiNode;
  variantNames: string[];
  getCurrent: () => string | undefined;
  selectVariant: (variantName: string) => void;
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

      const callable = () => {
        if (!node.variants?.[property]) {
          throw new Error(
            `${node.name} (${node.type}) has no variant “${property}”.`
          );
        }

        selectVariant(property);
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
