import type { TagStore } from "../tags/TagStore";
import { isPrimitiveTag, isUdtTag } from "../tags/TagDefinition";
import type { UdtDefinition, UdtMethodDefinition } from "../udt/UdtDefinition";

export type TagRuntimeContext = {
  log?: (...args: unknown[]) => void;
  emit?: (eventName: string, payload?: Record<string, unknown>) => void;
};

export type TagRuntimeApi = Record<string, unknown> & {
  $get(path: string): unknown;
  $set(path: string, value: unknown): void;
  $children(path: string): string[];
};

export type UdtInstanceApi = Record<string, unknown>;

const TAG_RUNTIME_HELPERS = new Set(["$get", "$set", "$children"]);

/**
 * Dynamic project-tag namespace used by scripts.
 *
 * Examples:
 *   tags.LineSpeed
 *   tags.LineSpeed = 1200
 *   tags.Pump1.speed
 *   tags.Pump1.speed = 1450
 *   tags.Pump1.start()
 *
 * Every write is routed through TagStore.set(), so validation, tag.changed and
 * subscriptions remain the single mutation pipeline.
 */
export function createTagRuntimeProxy(
  tagStore: TagStore,
  context: TagRuntimeContext = {}
): TagRuntimeApi {
  const udtProxyCache = new Map<string, UdtInstanceApi>();

  function createScopedUdtProxy(
    path: string,
    definitionId: string
  ): UdtInstanceApi {
    const cacheKey = `${definitionId}:${path}`;
    const cached = udtProxyCache.get(cacheKey);
    if (cached) return cached;

    const methodCache = new Map<string, (...args: unknown[]) => unknown>();
    const proxy = new Proxy({} as UdtInstanceApi, {
      get(_target, property) {
        if (typeof property !== "string") return undefined;
        const definition = getDefinition(tagStore, definitionId);
        if (!definition) return undefined;

        const field = definition.fields.find(
          (candidate) => candidate.name === property
        );
        if (field) {
          const fieldPath = `${path}.${field.name}`;
          return field.type.kind === "udt"
            ? createScopedUdtProxy(fieldPath, field.type.udtId)
            : tagStore.get(fieldPath);
        }

        const method = definition.methods.find(
          (candidate) => candidate.name === property
        );
        if (!method) return undefined;

        const callable = methodCache.get(method.id);
        if (callable) return callable;

        const nextCallable = (...args: unknown[]) =>
          executeUdtMethod(method, proxy, args, context);
        methodCache.set(method.id, nextCallable);
        return nextCallable;
      },
      set(_target, property, value) {
        if (typeof property !== "string") return false;
        const definition = getDefinition(tagStore, definitionId);
        const field = definition?.fields.find(
          (candidate) => candidate.name === property
        );
        if (!field) {
          throw new TypeError(`Unknown UDT member: ${path}.${property}`);
        }
        if (field.type.kind === "udt") {
          throw new TypeError(
            `Cannot assign an entire UDT value: ${path}.${property}`
          );
        }
        setOrThrow(tagStore, `${path}.${property}`, value);
        return true;
      },
      ownKeys() {
        const definition = getDefinition(tagStore, definitionId);
        return definition
          ? [
              ...definition.fields.map((field) => field.name),
              ...definition.methods.map((method) => method.name),
            ]
          : [];
      },
      has(_target, property) {
        if (typeof property !== "string") return false;
        const definition = getDefinition(tagStore, definitionId);
        return !!definition?.fields.some((field) => field.name === property) ||
          !!definition?.methods.some((method) => method.name === property);
      },
      getOwnPropertyDescriptor() {
        return { enumerable: true, configurable: true };
      },
    });

    udtProxyCache.set(cacheKey, proxy);
    return proxy;
  }

  const root = new Proxy({} as TagRuntimeApi, {
    get(_target, property) {
      if (typeof property !== "string") return undefined;

      if (property === "$get") {
        return (path: string) => tagStore.get(path);
      }
      if (property === "$set") {
        return (path: string, value: unknown) => setOrThrow(tagStore, path, value);
      }
      if (property === "$children") {
        return (path: string) => tagStore.children(path);
      }

      const tag = tagStore.getTagByName(property);
      if (!tag) return undefined;
      return isUdtTag(tag)
        ? createScopedUdtProxy(tag.name, tag.type.udtId)
        : tagStore.get(tag.name);
    },
    set(_target, property, value) {
      if (typeof property !== "string") return false;
      if (TAG_RUNTIME_HELPERS.has(property)) {
        throw new TypeError(`${property} is a read-only tag runtime helper.`);
      }
      const tag = tagStore.getTagByName(property);
      if (!tag) throw new TypeError(`Unknown tag: ${property}`);
      if (!isPrimitiveTag(tag)) {
        throw new TypeError(`Cannot assign an entire UDT value: ${tag.name}`);
      }
      setOrThrow(tagStore, tag.name, value);
      return true;
    },
    ownKeys() {
      return [
        ...TAG_RUNTIME_HELPERS,
        ...tagStore.listTags().map((tag) => tag.name),
      ];
    },
    has(_target, property) {
      return (
        typeof property === "string" &&
        (TAG_RUNTIME_HELPERS.has(property) || !!tagStore.getTagByName(property))
      );
    },
    getOwnPropertyDescriptor() {
      return { enumerable: true, configurable: true };
    },
  });

  return root;
}

/**
 * Backwards-compatible direct UDT globals plus the canonical `tags` namespace.
 * Primitive tags intentionally live under `tags` because assigning a primitive
 * JavaScript function parameter cannot be intercepted by a Proxy.
 */
export function createTagRuntimeGlobals(
  tagStore: TagStore,
  context: TagRuntimeContext = {}
): Record<string, unknown> {
  const tags = createTagRuntimeProxy(tagStore, context);
  const globals: Record<string, unknown> = { tags };

  for (const tag of tagStore.listTags()) {
    if (isUdtTag(tag)) {
      globals[tag.name] = tags[tag.name];
    }
  }

  return globals;
}

export function createUdtInstanceApi(
  tagName: string,
  tagStore: TagStore,
  context: TagRuntimeContext = {}
): UdtInstanceApi {
  const tag = tagStore.getTagByName(tagName);
  if (!tag || !isUdtTag(tag)) {
    throw new Error(`Unknown UDT tag: ${tagName}`);
  }
  const tags = createTagRuntimeProxy(tagStore, context);
  const api = tags[tagName];
  if (!api || typeof api !== "object") {
    throw new Error(`Cannot create UDT runtime proxy for: ${tagName}`);
  }
  return api as UdtInstanceApi;
}

function executeUdtMethod(
  method: UdtMethodDefinition,
  self: UdtInstanceApi,
  args: unknown[],
  context: TagRuntimeContext
) {
  const ctx = Object.freeze({
    log: (...values: unknown[]) => context.log?.(...values),
    emit: (eventName: string, payload?: Record<string, unknown>) =>
      context.emit?.(eventName, payload),
  });

  const execute = new Function(
    "self",
    "ctx",
    "args",
    `"use strict";\n${method.source}\n//# sourceURL=scadatomic://udt-method/${encodeURIComponent(method.name)}.js`
  ) as (
    self: UdtInstanceApi,
    contextApi: typeof ctx,
    args: unknown[]
  ) => unknown;

  return execute(self, ctx, args);
}

function setOrThrow(tagStore: TagStore, path: string, value: unknown) {
  const result = tagStore.set(path, value);
  if (!result.ok) throw new TypeError(result.error);
}

function getDefinition(
  tagStore: TagStore,
  definitionId: string
): UdtDefinition | undefined {
  return tagStore.getUdtDefinitionById(definitionId);
}
