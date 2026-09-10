import type { DataType } from "../types/DataType";
import { TypeRegistry } from "../types/TypeRegistry";
import type { UdtDefinition, UdtFieldDefinition } from "../udt/UdtDefinition";
import { isPrimitiveTag, isUdtTag, type ProjectData, type TagDefinition, type UdtTag } from "./TagDefinition";
import type { TagChangedEvent, TagChangedListener } from "./TagEvents";

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

export class TagStore {
  private data: ProjectData;
  private readonly listeners = new Map<string, Set<TagChangedListener>>();

  constructor(data: ProjectData) {
    this.data = structuredClone(data);
  }

  replaceData(data: ProjectData) {
    this.data = structuredClone(data);
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

  set(path: string, value: unknown): TagStoreSetResult {
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

  listTags() {
    return Object.values(this.data.tags);
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
