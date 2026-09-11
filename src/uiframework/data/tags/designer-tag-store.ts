import { useSyncExternalStore } from "react";
import { createEmptyProjectData, type ProjectData } from "./TagDefinition";
import { TagStore } from "./TagStore";

let activeStore = new TagStore(createEmptyProjectData());
const activeStoreListeners = new Set<() => void>();

export function getDesignerTagStore() {
  return activeStore;
}

/** Attach Designer controls directly to the canonical runtime TagStore. */
export function attachDesignerTagStore(store: TagStore) {
  if (activeStore === store) return;
  activeStore = store;
  notifyActiveStoreChanged();
}

export function detachDesignerTagStore(store: TagStore, data?: ProjectData) {
  if (activeStore !== store) return;
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
