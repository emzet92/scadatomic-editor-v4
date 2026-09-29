import { useSyncExternalStore } from "react";

export type OpenModalEntry = {
  modalId: string;
  payload?: Record<string, unknown> | undefined;
};

export type ModalTransition = {
  id: string;
  modalId: string;
  type: "open" | "close";
  payload?: Record<string, unknown> | undefined;
};

type ProjectModalState = {
  open: OpenModalEntry[];
  transitions: ModalTransition[];
  listeners: Set<() => void>;
  revision: number;
};

const projects = new Map<string, ProjectModalState>();

function getProject(projectId: string): ProjectModalState {
  let state = projects.get(projectId);
  if (!state) {
    state = { open: [], transitions: [], listeners: new Set(), revision: 0 };
    projects.set(projectId, state);
  }
  return state;
}

function publish(projectId: string) {
  const state = getProject(projectId);
  state.revision += 1;
  for (const listener of state.listeners) listener();
}

export function openProjectModal(
  projectId: string,
  modalId: string,
  payload?: Record<string, unknown>
) {
  const state = getProject(projectId);
  state.open = [...state.open.filter((entry) => entry.modalId !== modalId), { modalId, ...(payload ? { payload } : {}) }];
  state.transitions = [...state.transitions.slice(-49), { id: crypto.randomUUID(), modalId, type: "open", ...(payload ? { payload } : {}) }];
  publish(projectId);
}

export function closeProjectModal(
  projectId: string,
  modalId: string,
  payload?: Record<string, unknown>
) {
  const state = getProject(projectId);
  if (!state.open.some((entry) => entry.modalId === modalId)) return;
  state.open = state.open.filter((entry) => entry.modalId !== modalId);
  state.transitions = [...state.transitions.slice(-49), { id: crypto.randomUUID(), modalId, type: "close", ...(payload ? { payload } : {}) }];
  publish(projectId);
}

export function getProjectModalSnapshot(projectId: string) {
  const state = getProject(projectId);
  return { open: state.open, transitions: state.transitions, revision: state.revision };
}

export function subscribeProjectModals(projectId: string, listener: () => void) {
  const state = getProject(projectId);
  state.listeners.add(listener);
  return () => state.listeners.delete(listener);
}

export function useProjectModalRevision(projectId?: string) {
  return useSyncExternalStore(
    (listener) => (projectId ? subscribeProjectModals(projectId, listener) : () => undefined),
    () => (projectId ? getProject(projectId).revision : 0),
    () => 0
  );
}
