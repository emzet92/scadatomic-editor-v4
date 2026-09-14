import type { TagFieldRef } from "../../uiframework/data/tags/TagFieldRef";
import { tagFieldRefKey } from "../../uiframework/data/tags/TagFieldRef";

export type TagReactiveRef = {
  kind: "tag";
  ref: TagFieldRef;
  /** Human-readable diagnostic path. Stable ids in ref remain authoritative. */
  path?: string | undefined;
};

export type PageStateReactiveRef = {
  kind: "page-state";
  pageId: string;
  key: string;
};

export type ComponentStateReactiveRef = {
  kind: "component-state";
  componentId: string;
  key: string;
};

export type MemoryReactiveRef = {
  kind: "memory";
  key: string;
};

export type ReactiveRef =
  | TagReactiveRef
  | PageStateReactiveRef
  | ComponentStateReactiveRef
  | MemoryReactiveRef;

export type ReactiveKey = string;

export function toReactiveKey(ref: ReactiveRef): ReactiveKey {
  switch (ref.kind) {
    case "tag":
      return `tag:${tagFieldRefKey(ref.ref)}`;
    case "page-state":
      return `page-state:${ref.pageId}:${ref.key}`;
    case "component-state":
      return `component-state:${ref.componentId}:${ref.key}`;
    case "memory":
      return `memory:${ref.key}`;
  }
}

export function isReactiveRef(value: unknown): value is ReactiveRef {
  if (!isRecord(value) || typeof value.kind !== "string") return false;

  if (value.kind === "tag") {
    return isRecord(value.ref) &&
      typeof value.ref.tagId === "string" &&
      Array.isArray(value.ref.fieldIds) &&
      value.ref.fieldIds.every((fieldId) => typeof fieldId === "string") &&
      (value.path === undefined || typeof value.path === "string");
  }

  if (value.kind === "page-state") {
    return typeof value.pageId === "string" && typeof value.key === "string";
  }

  if (value.kind === "component-state") {
    return typeof value.componentId === "string" && typeof value.key === "string";
  }

  return value.kind === "memory" && typeof value.key === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
