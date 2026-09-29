import { useSyncExternalStore } from "react";
import type { TagRuntime } from "../runtime/TagRuntime";
import { createEmptyProjectData, type ProjectData } from "./TagDefinition";
import { TagStore } from "./TagStore";

let activeStore = new TagStore(createEmptyProjectData());
let activeRuntime: TagRuntime | undefined;
const activeStoreListeners = new Set<() => void>();

export function getDesignerTagStore() {
  return activeStore;
}

export function getDesignerTagRuntime() {
  return activeRuntime;
}

/** Attach Designer controls directly to the canonical project runtime. */
export function attachDesignerTagRuntime(runtime: TagRuntime) {
  if (activeRuntime === runtime && activeStore === runtime.store) return;
  activeRuntime = runtime;
  activeStore = runtime.store;
  notifyActiveStoreChanged();
}

export function detachDesignerTagRuntime(runtime: TagRuntime, data?: ProjectData) {
  if (activeRuntime !== runtime) return;
  activeRuntime = undefined;
  activeStore = new TagStore(data ?? createEmptyProjectData());
  notifyActiveStoreChanged();
}

/**
 * Synchronizes tag/UDT definitions without resetting live runtime values.
 * Runtime writes remain session state and never get copied into UiDocument.
 */
export function replaceDesignerTagData(data: ProjectData | undefined) {
  activeStore.reconfigure(data ?? createEmptyProjectData());
}

export function writeDesignerTagValue(path: string, value: unknown) {
  if (activeRuntime) {
    return activeRuntime.write(path, value, { kind: "user" });
  }
  // Pre-session fallback used only while the designer is bootstrapping.
  const result = activeStore.set(path, value, { source: { kind: "user" } });
  return result.ok ? { ok: true as const } : { ok: false as const, error: result.error };
}

export function useDesignerTagValue(path: string | undefined) {
  return useSyncExternalStore(
    (listener) => {
      let unsubscribeStore = subscribeToActiveStore(path, listener);
      const handleStoreChanged = () => {
        unsubscribeStore();
        unsubscribeStore = subscribeToActiveStore(path, listener);
        listener();
      };
      activeStoreListeners.add(handleStoreChanged);
      return () => {
        unsubscribeStore();
        activeStoreListeners.delete(handleStoreChanged);
      };
    },
    () => (path ? activeStore.get(path) : undefined),
    () => undefined
  );
}

function subscribeToActiveStore(path: string | undefined, listener: () => void) {
  return path ? activeStore.subscribe(path, () => listener()) : () => undefined;
}

function notifyActiveStoreChanged() {
  for (const listener of activeStoreListeners) listener();
}
