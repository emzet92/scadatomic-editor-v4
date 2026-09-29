import { useSyncExternalStore } from "react";

export type RuntimeThemeSnapshot = {
  themeId?: string | undefined;
  revision: number;
};

const snapshots = new Map<string, RuntimeThemeSnapshot>();
const listeners = new Map<string, Set<() => void>>();

export function getProjectRuntimeThemeSnapshot(projectId: string): RuntimeThemeSnapshot {
  return snapshots.get(projectId) ?? { revision: 0 };
}

export function setProjectRuntimeTheme(projectId: string, themeId: string) {
  const current = getProjectRuntimeThemeSnapshot(projectId);
  if (current.themeId === themeId) return;
  snapshots.set(projectId, { themeId, revision: current.revision + 1 });
  notify(projectId);
}

export function resetProjectRuntimeTheme(projectId: string) {
  const current = getProjectRuntimeThemeSnapshot(projectId);
  if (current.themeId === undefined) return;
  snapshots.set(projectId, { revision: current.revision + 1 });
  notify(projectId);
}

export function useProjectRuntimeThemeRevision(projectId?: string) {
  return useSyncExternalStore(
    (listener) => (projectId ? subscribe(projectId, listener) : () => undefined),
    () => (projectId ? getProjectRuntimeThemeSnapshot(projectId).revision : 0),
    () => 0
  );
}

function subscribe(projectId: string, listener: () => void) {
  const projectListeners = listeners.get(projectId) ?? new Set<() => void>();
  projectListeners.add(listener);
  listeners.set(projectId, projectListeners);
  return () => {
    projectListeners.delete(listener);
    if (projectListeners.size === 0) listeners.delete(projectId);
  };
}

function notify(projectId: string) {
  for (const listener of listeners.get(projectId) ?? []) listener();
}
