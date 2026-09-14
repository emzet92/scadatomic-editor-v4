import {
  configureMockRuntimeProjectData,
  getMockRuntimeSession,
  hasMockRuntimeSession,
  replaceMockTagStoreData,
} from "../mock/mock-tag-runtime";
import type { ProjectData } from "./data/tags/TagDefinition";
import { runtimeSignals } from "./runtime-signals";
import type { TagRuntime } from "./data/runtime/TagRuntime";

const EMPTY_PROJECT_DATA: ProjectData = { udts: {}, tags: {} };
const signalBridges = new Map<string, { runtime: TagRuntime; unsubscribe: () => void }>();

/**
 * Synchronizes runtime tag schema at an explicit project boundary.
 *
 * TagStore remains the canonical process image. RuntimeSignalStore is now only
 * a trend/history projection fed from TagRuntime.reactive; it is no longer an
 * independent source of live tag truth.
 */
export function hydrateRuntimeTagState(
  projectId: string,
  data: ProjectData | undefined
) {
  const resolvedData = data ?? EMPTY_PROJECT_DATA;
  const session = hasMockRuntimeSession(projectId)
    ? configureMockRuntimeProjectData(projectId, resolvedData)
    : getMockRuntimeSession(projectId, resolvedData);
  attachRuntimeSignalBridge(projectId, session.tags);
  syncRuntimeSignals(session.tags);
}

/** Explicit full reset reserved for a real runtime restart/new session. */
export function resetRuntimeTagState(
  projectId: string,
  data: ProjectData | undefined
) {
  replaceMockTagStoreData(projectId, data ?? EMPTY_PROJECT_DATA);
  const session = getMockRuntimeSession(projectId);
  attachRuntimeSignalBridge(projectId, session.tags);
  syncRuntimeSignals(session.tags);
}

export function refreshRuntimeTagSignals(projectId: string) {
  const session = getMockRuntimeSession(projectId);
  attachRuntimeSignalBridge(projectId, session.tags);
  syncRuntimeSignals(session.tags);
}

function attachRuntimeSignalBridge(projectId: string, runtime: TagRuntime) {
  const existing = signalBridges.get(projectId);
  if (existing?.runtime === runtime) return;
  existing?.unsubscribe();

  const unsubscribe = runtime.reactive.subscribeAll((change) => {
    if (change.ref.kind !== "tag") return;
    const path = runtime.source.describe(change.ref);
    runtimeSignals.set(path, change.value);
  });
  signalBridges.set(projectId, { runtime, unsubscribe });
}

function syncRuntimeSignals(runtime: TagRuntime) {
  for (const entry of runtime.store.listPrimitivePaths()) {
    runtimeSignals.set(entry.path, entry.value);
  }
}
