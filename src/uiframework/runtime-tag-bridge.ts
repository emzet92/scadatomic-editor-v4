import {
  configureMockRuntimeProjectData,
  getMockTagStore,
  hasMockRuntimeSession,
  replaceMockTagStoreData,
} from "../mock/mock-tag-runtime";
import type { ProjectData } from "./data/tags/TagDefinition";
import { flattenTagValues } from "./data/runtime/UdtRuntime";
import { runtimeSignals } from "./runtime-signals";

const EMPTY_PROJECT_DATA: ProjectData = { udts: {}, tags: {} };

/**
 * Synchronizes runtime tag schema at an explicit project boundary.
 *
 * The first load initializes live values from project/session data. Further
 * publish/config updates preserve the live process image and only reconfigure
 * definitions/mappings. This prevents a normal publish or UI update from
 * resetting values that were written through the driver runtime.
 */
export function hydrateRuntimeTagState(
  projectId: string,
  data: ProjectData | undefined
) {
  const resolvedData = data ?? EMPTY_PROJECT_DATA;
  const store = hasMockRuntimeSession(projectId)
    ? configureMockRuntimeProjectData(projectId, resolvedData).tagStore
    : replaceMockTagStoreData(projectId, resolvedData);
  syncRuntimeSignals(store.snapshot());
}

/** Explicit full reset reserved for a real runtime restart/new session. */
export function resetRuntimeTagState(
  projectId: string,
  data: ProjectData | undefined
) {
  const store = replaceMockTagStoreData(projectId, data ?? EMPTY_PROJECT_DATA);
  syncRuntimeSignals(store.snapshot());
}

export function refreshRuntimeTagSignals(projectId: string) {
  syncRuntimeSignals(getMockTagStore(projectId).snapshot());
}

function syncRuntimeSignals(data: ProjectData) {
  for (const [path, value] of flattenTagValues(data)) {
    runtimeSignals.set(path, value);
  }
}
