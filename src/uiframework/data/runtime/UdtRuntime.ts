import { TagStore } from "../tags/TagStore";
import { isPrimitiveTag, isUdtTag, type ProjectData } from "../tags/TagDefinition";
import type { UdtDefinition, UdtMethodDefinition } from "../udt/UdtDefinition";

export type UdtMethodContext = {
  log?: (...args: unknown[]) => void;
  emit?: (eventName: string, payload?: Record<string, unknown>) => void;
};

export type UdtInstanceApi = Record<string, unknown>;

export function createUdtRuntimeGlobals(
  tagStore: TagStore,
  context: UdtMethodContext = {}
): Record<string, UdtInstanceApi> {
  const globals: Record<string, UdtInstanceApi> = {};
  for (const tag of tagStore.listTags()) {
    if (tag.type.kind !== "udt") continue;
    globals[tag.name] = createUdtInstanceApi(tag.name, tagStore, context);
  }
  return globals;
}

export function createUdtInstanceApi(
  tagName: string,
  tagStore: TagStore,
  context: UdtMethodContext = {}
): UdtInstanceApi {
  const methodCache = new Map<string, (...args: unknown[]) => unknown>();
  const proxy = new Proxy({} as UdtInstanceApi, {
    get(_target, property) {
      if (typeof property !== "string") return undefined;
      const tag = tagStore.getTagByName(tagName);
      if (!tag || !isUdtTag(tag)) return undefined;
      const definition = tagStore.getUdtDefinition(tag);
      if (!definition) return undefined;

      const field = definition.fields.find((candidate) => candidate.name === property);
      if (field) return tagStore.get(`${tagName}.${property}`);

      const method = definition.methods.find((candidate) => candidate.name === property);
      if (!method) return undefined;
      const cached = methodCache.get(method.id);
      if (cached) return cached;

      const callable = (...args: unknown[]) =>
        executeUdtMethod(method, proxy, args, context);
      methodCache.set(method.id, callable);
      return callable;
    },
    set(_target, property, value) {
      if (typeof property !== "string") return false;
      const result = tagStore.set(`${tagName}.${property}`, value);
      if (!result.ok) throw new TypeError(result.error);
      return true;
    },
    ownKeys() {
      const tag = tagStore.getTagByName(tagName);
      if (!tag || !isUdtTag(tag)) return [];
      const definition = tagStore.getUdtDefinition(tag);
      return definition
        ? [...definition.fields.map((field) => field.name), ...definition.methods.map((method) => method.name)]
        : [];
    },
    getOwnPropertyDescriptor() {
      return { enumerable: true, configurable: true };
    },
  });

  return proxy;
}

export function getUdtApiDescription(data: ProjectData, definition: UdtDefinition) {
  return {
    fields: definition.fields.map((field) => ({
      name: field.name,
      type: field.type.kind === "udt" ? data.udts[field.type.udtId]?.name ?? "UDT" : field.type.kind,
    })),
    methods: definition.methods.map((method) => ({ name: method.name })),
  };
}

function executeUdtMethod(
  method: UdtMethodDefinition,
  self: UdtInstanceApi,
  args: unknown[],
  context: UdtMethodContext
) {
  const ctx: {
    log: (...values: unknown[]) => void;
    emit: (eventName: string, payload?: Record<string, unknown>) => void;
  } = Object.freeze({
    log: (...values: unknown[]) => { context.log?.(...values); },
    emit: (eventName: string, payload?: Record<string, unknown>) => { context.emit?.(eventName, payload); },
  });

  const execute = new Function(
    "self",
    "ctx",
    "args",
    `"use strict";\n${method.source}\n//# sourceURL=scadatomic://udt-method/${encodeURIComponent(method.name)}.js`
  ) as (self: UdtInstanceApi, contextApi: { log: (...values: unknown[]) => void; emit: (eventName: string, payload?: Record<string, unknown>) => void }, args: unknown[]) => unknown;

  return execute(self, ctx, args);
}

export function flattenTagValues(data: ProjectData): Array<[string, unknown]> {
  const values: Array<[string, unknown]> = [];
  for (const tag of Object.values(data.tags)) {
    if (isPrimitiveTag(tag)) {
      values.push([tag.name, tag.value]);
      continue;
    }
    const definition = data.udts[tag.type.udtId];
    if (!definition) continue;
    flattenUdtValues(tag.name, tag.values, definition, data, values);
  }
  return values;
}

function flattenUdtValues(
  prefix: string,
  values: Record<string, unknown>,
  definition: UdtDefinition,
  data: ProjectData,
  output: Array<[string, unknown]>
) {
  for (const field of definition.fields) {
    const path = `${prefix}.${field.name}`;
    if (field.type.kind === "udt") {
      const nestedDefinition = data.udts[field.type.udtId];
      const nestedValues = values[field.name];
      if (nestedDefinition && isRecord(nestedValues)) {
        flattenUdtValues(path, nestedValues, nestedDefinition, data, output);
      }
    } else {
      output.push([path, values[field.name]]);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
