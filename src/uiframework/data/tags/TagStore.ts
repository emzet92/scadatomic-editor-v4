import type { DataType, PrimitiveDataType } from "../types/DataType";
import { TypeRegistry } from "../types/TypeRegistry";
import type { UdtDefinition, UdtFieldDefinition } from "../udt/UdtDefinition";
import { isPrimitiveTag, isUdtTag, type ProjectData, type TagDefinition, type UdtTag } from "./TagDefinition";
import type { TagChangedEvent, TagChangedListener, TagWriteOptions } from "./TagEvents";

export type TagStoreSetResult =
  | { ok: true; changed: boolean; event?: TagChangedEvent | undefined }
  | { ok: false; error: string };

export type ResolvedTagPath = {
  path: string;
  tag: TagDefinition;
  type: DataType;
  value: unknown;
  field?: UdtFieldDefinition | undefined;
};


export type ResolvedPrimitiveTagPath = Omit<ResolvedTagPath, "type"> & {
  type: PrimitiveDataType;
};

export class TagStore {
  private data: ProjectData;
  private readonly listeners = new Map<string, Set<TagChangedListener>>();

  constructor(data: ProjectData) {
    this.data = structuredClone(data);
  }

  replaceData(data: ProjectData) {
    this.data = structuredClone(data);
  }

  /**
   * Updates project/tag definitions while preserving the current runtime values
   * by stable tag/field ids. This is used for live designer configuration
   * changes and must not behave like a runtime restart.
   */
  reconfigure(data: ProjectData) {
    const runtimeValues = capturePrimitiveRuntimeValues(this.data);
    const next = structuredClone(data);
    applyPrimitiveRuntimeValues(next, runtimeValues);
    this.data = next;
  }

  snapshot(): ProjectData {
    return structuredClone(this.data);
  }

  get(path: string): unknown {
    return this.resolve(path)?.value;
  }

  resolve(path: string): ResolvedTagPath | undefined {
    const segments = splitPath(path);
    const tagName = segments.shift();
    if (!tagName) return undefined;

    const tag = Object.values(this.data.tags).find((candidate) => candidate.name === tagName);
    if (!tag) return undefined;

    if (segments.length === 0) {
      return {
        path: tag.name,
        tag,
        type: tag.type,
        value: isUdtTag(tag) ? tag.values : tag.value,
      };
    }

    if (!isUdtTag(tag)) return undefined;

    let type: DataType = tag.type;
    let value: unknown = tag.values;
    let field: UdtFieldDefinition | undefined;

    for (const segment of segments) {
      if (type.kind !== "udt") return undefined;
      const definition: UdtDefinition | undefined = this.data.udts[type.udtId];
      if (!definition) return undefined;
      field = definition.fields.find((candidate: UdtFieldDefinition) => candidate.name === segment);
      if (!field || !isRecord(value)) return undefined;
      type = field.type;
      value = value[segment];
    }

    return { path, tag, type, value, field };
  }

  set(path: string, value: unknown, options: TagWriteOptions = {}): TagStoreSetResult {
    const resolved = this.resolve(path);
    if (!resolved) return { ok: false, error: `Unknown tag path: ${path}` };
    if (resolved.type.kind === "udt") {
      return { ok: false, error: `Cannot assign an entire UDT value: ${path}` };
    }
    if (!TypeRegistry.validate(resolved.type, value)) {
      return {
        ok: false,
        error: `Invalid ${TypeRegistry.getDisplayName(resolved.type)} value for ${path}.`,
      };
    }
    if (Object.is(resolved.value, value)) return { ok: true, changed: false };

    const oldValue = resolved.value;
    const segments = splitPath(path);
    const tagName = segments.shift()!;
    const tagEntry = Object.entries(this.data.tags).find(([, tag]) => tag.name === tagName);
    if (!tagEntry) return { ok: false, error: `Unknown tag: ${tagName}` };
    const [tagId, tag] = tagEntry;

    let nextTag: TagDefinition;
    if (segments.length === 0) {
      if (!isPrimitiveTag(tag)) {
        return { ok: false, error: `Cannot assign an entire UDT value: ${path}` };
      }
      nextTag = { ...tag, value };
    } else {
      if (!isUdtTag(tag)) {
        return { ok: false, error: `Tag is not a UDT: ${tag.name}` };
      }
      nextTag = {
        ...tag,
        values: setNestedValue(tag.values, segments, value),
      } satisfies UdtTag;
    }

    this.data = {
      ...this.data,
      tags: { ...this.data.tags, [tagId]: nextTag },
    };

    const event: TagChangedEvent = {
      type: "tag.changed",
      path,
      oldValue,
      newValue: value,
      ...(options.source ? { source: options.source } : {}),
    };
    this.emit(event);
    return { ok: true, changed: true, event };
  }

  subscribe(path: string, listener: TagChangedListener) {
    const listeners = this.listeners.get(path) ?? new Set<TagChangedListener>();
    listeners.add(listener);
    this.listeners.set(path, listeners);
    return () => this.unsubscribe(path, listener);
  }

  unsubscribe(path: string, listener: TagChangedListener) {
    const listeners = this.listeners.get(path);
    if (!listeners) return;
    listeners.delete(listener);
    if (listeners.size === 0) this.listeners.delete(path);
  }

  children(path: string): string[] {
    const resolved = this.resolve(path);
    if (!resolved || resolved.type.kind !== "udt") return [];
    const definition = this.data.udts[resolved.type.udtId];
    if (!definition) return [];
    return definition.fields.map((field) => `${path}.${field.name}`);
  }

  getTagByName(name: string) {
    return Object.values(this.data.tags).find((tag) => tag.name === name);
  }

  getUdtDefinition(tag: UdtTag): UdtDefinition | undefined {
    return this.data.udts[tag.type.udtId];
  }

  getUdtDefinitionById(udtId: string): UdtDefinition | undefined {
    return this.data.udts[udtId];
  }

  listTags() {
    return Object.values(this.data.tags);
  }

  /**
   * Flat primitive runtime leaves. Useful for simulator/drivers and later
   * data-driven components without exposing TagStore's mutable backing data.
   */
  listPrimitivePaths(): ResolvedPrimitiveTagPath[] {
    const paths: ResolvedPrimitiveTagPath[] = [];
    for (const tag of this.listTags()) {
      collectPrimitivePaths(this, tag.name, paths);
    }
    return paths;
  }

  private emit(event: TagChangedEvent) {
    for (const listener of this.listeners.get(event.path) ?? []) listener(event);
    for (const listener of this.listeners.get("*") ?? []) listener(event);
  }
}

function splitPath(path: string) {
  return path.split(".").map((segment) => segment.trim()).filter(Boolean);
}

function setNestedValue(
  root: Record<string, unknown>,
  segments: string[],
  value: unknown
): Record<string, unknown> {
  const [head, ...tail] = segments;
  if (!head) return root;
  if (tail.length === 0) return { ...root, [head]: value };
  const child = isRecord(root[head]) ? root[head] : {};
  return { ...root, [head]: setNestedValue(child, tail, value) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function collectPrimitivePaths(
  store: TagStore,
  path: string,
  output: ResolvedPrimitiveTagPath[]
) {
  const resolved = store.resolve(path);
  if (!resolved) return;
  if (resolved.type.kind !== "udt") {
    output.push({ ...resolved, type: resolved.type });
    return;
  }
  for (const childPath of store.children(path)) {
    collectPrimitivePaths(store, childPath, output);
  }
}


type PrimitiveRuntimeValue = {
  tagId: string;
  fieldIds: string[];
  value: unknown;
};

function capturePrimitiveRuntimeValues(data: ProjectData): PrimitiveRuntimeValue[] {
  const values: PrimitiveRuntimeValue[] = [];
  for (const [tagId, tag] of Object.entries(data.tags)) {
    if (isPrimitiveTag(tag)) {
      values.push({ tagId, fieldIds: [], value: tag.value });
      continue;
    }
    collectUdtRuntimeValues(data, tagId, tag.type.udtId, tag.values, [], values);
  }
  return values;
}

function collectUdtRuntimeValues(
  data: ProjectData,
  tagId: string,
  udtId: string,
  record: Record<string, unknown>,
  fieldIds: string[],
  output: PrimitiveRuntimeValue[]
) {
  const definition = data.udts[udtId];
  if (!definition) return;
  for (const field of definition.fields) {
    const nextIds = [...fieldIds, field.id];
    const value = record[field.name];
    if (field.type.kind === "udt") {
      if (isRecord(value)) {
        collectUdtRuntimeValues(data, tagId, field.type.udtId, value, nextIds, output);
      }
      continue;
    }
    output.push({ tagId, fieldIds: nextIds, value });
  }
}

function applyPrimitiveRuntimeValues(
  data: ProjectData,
  values: PrimitiveRuntimeValue[]
) {
  for (const runtimeValue of values) {
    const tag = data.tags[runtimeValue.tagId];
    if (!tag) continue;
    if (runtimeValue.fieldIds.length === 0) {
      if (isPrimitiveTag(tag) && TypeRegistry.validate(tag.type, runtimeValue.value)) {
        data.tags[runtimeValue.tagId] = { ...tag, value: runtimeValue.value };
      }
      continue;
    }
    if (!isUdtTag(tag)) continue;
    const resolved = resolveFieldPathByIds(data, tag.type.udtId, runtimeValue.fieldIds);
    if (!resolved || resolved.type.kind === "udt" || !TypeRegistry.validate(resolved.type, runtimeValue.value)) {
      continue;
    }
    data.tags[runtimeValue.tagId] = {
      ...tag,
      values: setNestedValue(tag.values, resolved.names, runtimeValue.value),
    };
  }
}

function resolveFieldPathByIds(
  data: ProjectData,
  rootUdtId: string,
  fieldIds: string[]
): { names: string[]; type: DataType } | undefined {
  let udtId = rootUdtId;
  const names: string[] = [];
  let type: DataType | undefined;
  for (const fieldId of fieldIds) {
    const definition = data.udts[udtId];
    const field = definition?.fields.find((candidate) => candidate.id === fieldId);
    if (!field) return undefined;
    names.push(field.name);
    type = field.type;
    if (field.type.kind === "udt") udtId = field.type.udtId;
  }
  return type ? { names, type } : undefined;
}
