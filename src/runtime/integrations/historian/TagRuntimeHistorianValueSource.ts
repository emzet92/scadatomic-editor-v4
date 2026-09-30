import type { HistorianValueSource } from "../../../historian";
import type { TagRuntime } from "../../../tags/runtime/TagRuntime";

/**
 * Adapter from the canonical project TagRuntime to the historian input port.
 *
 * The historian core intentionally knows nothing about TagRuntime. This adapter
 * lives at the composition edge so IndexedDB/local mock runtime can be swapped
 * for a backend/edge historian later without changing sampling policies or UI.
 */
export function createTagRuntimeHistorianValueSource(
  runtime: TagRuntime,
): HistorianValueSource {
  return {
    read(path) {
      return runtime.get(path);
    },
    subscribe(path, listener) {
      // Subscribe to the canonical process image. TagStore keeps path listeners
      // across schema reconfiguration, so this is safe even if the recorder is
      // started just before the Designer finishes hydrating project tag data.
      return runtime.store.subscribe(path, () => listener());
    },
  };
}
