import { useSyncExternalStore } from "react";

type DerivedNodeState = {
  props: Record<string, unknown>;
  variant?: string | undefined;
};

type ProjectDerivedState = {
  nodes: Map<string, DerivedNodeState>;
  listeners: Set<() => void>;
  revision: number;
};

const projects = new Map<string, ProjectDerivedState>();

function getProject(projectId: string): ProjectDerivedState {
  let project = projects.get(projectId);
  if (!project) {
    project = { nodes: new Map(), listeners: new Set(), revision: 0 };
    projects.set(projectId, project);
  }
  return project;
}

export function setReactiveNodeProperty(
  projectId: string,
  nodeId: string,
  property: string,
  value: unknown
) {
  const project = getProject(projectId);
  const current = project.nodes.get(nodeId) ?? { props: {} };
  if (Object.is(current.props[property], value)) return;

  project.nodes.set(nodeId, {
    ...current,
    props: { ...current.props, [property]: value },
  });
  notify(project);
}

export function clearReactiveNodeProperty(
  projectId: string,
  nodeId: string,
  property: string
) {
  const project = getProject(projectId);
  const current = project.nodes.get(nodeId);
  if (!current || !Object.prototype.hasOwnProperty.call(current.props, property)) return;

  const props = { ...current.props };
  delete props[property];
  if (Object.keys(props).length === 0 && current.variant === undefined) {
    project.nodes.delete(nodeId);
  } else {
    project.nodes.set(nodeId, { ...current, props });
  }
  notify(project);
}

export function setReactiveNodeVariant(
  projectId: string,
  nodeId: string,
  variant: string
) {
  const project = getProject(projectId);
  const current = project.nodes.get(nodeId) ?? { props: {} };
  if (current.variant === variant) return;
  project.nodes.set(nodeId, { ...current, variant });
  notify(project);
}

export function clearReactiveNodeVariant(projectId: string, nodeId: string) {
  const project = getProject(projectId);
  const current = project.nodes.get(nodeId);
  if (!current || current.variant === undefined) return;
  if (Object.keys(current.props).length === 0) {
    project.nodes.delete(nodeId);
  } else {
    project.nodes.set(nodeId, { props: current.props });
  }
  notify(project);
}

export function getReactiveNodeProps(projectId: string, nodeId: string) {
  return { ...(getProject(projectId).nodes.get(nodeId)?.props ?? {}) };
}

export function getReactiveNodeVariant(projectId: string, nodeId: string) {
  return getProject(projectId).nodes.get(nodeId)?.variant;
}

export function clearProjectReactiveUiState(projectId: string) {
  const project = getProject(projectId);
  if (project.nodes.size === 0) return;
  project.nodes.clear();
  notify(project);
}

export function subscribeProjectReactiveUiState(
  projectId: string,
  listener: () => void
) {
  const project = getProject(projectId);
  project.listeners.add(listener);
  return () => project.listeners.delete(listener);
}

export function getProjectReactiveUiRevision(projectId: string) {
  return getProject(projectId).revision;
}

export function useProjectReactiveUiRevision(projectId: string | undefined) {
  return useSyncExternalStore(
    (listener) => projectId
      ? subscribeProjectReactiveUiState(projectId, listener)
      : () => undefined,
    () => projectId ? getProjectReactiveUiRevision(projectId) : 0,
    () => 0
  );
}

function notify(project: ProjectDerivedState) {
  project.revision += 1;
  for (const listener of project.listeners) listener();
}
