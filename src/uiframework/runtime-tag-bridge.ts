import { replaceMockTagStoreData } from "../mock/mock-tag-runtime";
import type { ProjectData } from "./data/tags/TagDefinition";
import { flattenTagValues } from "./data/runtime/UdtRuntime";
import { runtimeSignals } from "./runtime-signals";

const EMPTY_PROJECT_DATA: ProjectData = { udts: {}, tags: {} };

/**
 * Rehydrates runtime tag storage and signal snapshots at an explicit runtime
 * boundary (initial project load / publish). Never call this from a React state
 * updater: runtimeSignals.set() synchronously notifies useSyncExternalStore subscribers.
 */
export function hydrateRuntimeTagState(
  projectId: string,
  data: ProjectData | undefined
) {
  const resolvedData = data ?? EMPTY_PROJECT_DATA;
  replaceMockTagStoreData(projectId, resolvedData);
  for (const [path, value] of flattenTagValues(resolvedData)) {
    runtimeSignals.set(path, value);
  }
}
