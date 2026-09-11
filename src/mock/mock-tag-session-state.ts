import { TypeRegistry } from "../uiframework/data/types/TypeRegistry";
import {
  resolveTagFieldRef,
  tagFieldRefKey,
  type TagFieldRef,
} from "../uiframework/data/tags/TagFieldRef";
import type { ProjectData } from "../uiframework/data/tags/TagDefinition";
import { TagStore } from "../uiframework/data/tags/TagStore";

const STORAGE_PREFIX = "scadatomic.mock.tag-session.v1.";

type PersistedTagValue = {
  target: TagFieldRef;
  value: unknown;
};

type PersistedTagSession = Record<string, PersistedTagValue>;

const memoryFallback = new Map<string, PersistedTagSession>();

/**
 * Runtime tag values are user-session state. Project JSON keeps designer/default
 * values; opening/publishing a runtime overlays the last values from this tab's
 * session without mutating the project document.
 */
export function hydrateProjectDataFromTagSession(
  projectId: string,
  data: ProjectData
): ProjectData {
  const session = readSession(projectId);
  const store = new TagStore(data);

  for (const entry of Object.values(session)) {
    const resolved = resolveTagFieldRef(data, entry.target);
    if (!resolved || !TypeRegistry.validate(resolved.type, entry.value)) continue;
    store.set(resolved.path, entry.value, { source: { kind: "session" } });
  }

  return store.snapshot();
}

export function persistTagValueToSession(
  projectId: string,
  target: TagFieldRef,
  value: unknown
) {
  const current = readSession(projectId);
  const key = tagFieldRefKey(target);
  current[key] = {
    target: { tagId: target.tagId, fieldIds: [...target.fieldIds] },
    value: cloneSerializable(value),
  };
  writeSession(projectId, current);
}

export function clearTagValueSession(projectId: string) {
  const key = storageKey(projectId);
  memoryFallback.delete(key);
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // In-memory fallback remains sufficient for the development runtime.
  }
}

function readSession(projectId: string): PersistedTagSession {
  const key = storageKey(projectId);
  const cached = memoryFallback.get(key);
  if (cached) return structuredClone(cached);

  if (typeof sessionStorage === "undefined") return {};

  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const parsed = parseSession(JSON.parse(raw));
      memoryFallback.set(key, parsed);
      return structuredClone(parsed);
    }
  } catch (error) {
    console.warn("[mock-tag-session] Failed to read tag session state", error);
  }

  return {};
}

function writeSession(projectId: string, value: PersistedTagSession) {
  const key = storageKey(projectId);
  const snapshot = structuredClone(value);
  memoryFallback.set(key, snapshot);
  if (typeof sessionStorage === "undefined") return;

  try {
    sessionStorage.setItem(key, JSON.stringify(snapshot));
  } catch (error) {
    console.warn("[mock-tag-session] Failed to persist tag session state", error);
  }
}

function parseSession(value: unknown): PersistedTagSession {
  if (!isRecord(value)) return {};
  const result: PersistedTagSession = {};

  for (const [key, candidate] of Object.entries(value)) {
    if (!isRecord(candidate) || !isTagFieldRef(candidate.target)) continue;
    result[key] = {
      target: {
        tagId: candidate.target.tagId,
        fieldIds: [...candidate.target.fieldIds],
      },
      value: candidate.value,
    };
  }
  return result;
}

function isTagFieldRef(value: unknown): value is TagFieldRef {
  return isRecord(value) &&
    typeof value.tagId === "string" &&
    Array.isArray(value.fieldIds) &&
    value.fieldIds.every((fieldId) => typeof fieldId === "string");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function storageKey(projectId: string) {
  return `${STORAGE_PREFIX}${encodeURIComponent(projectId)}`;
}

function cloneSerializable(value: unknown) {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value)) as unknown;
  }
}
