import {
  createEmptyProjectData,
  type ProjectData,
} from "../uiframework/data/tags/TagDefinition";
import { ProjectRuntimeSession } from "../uiframework/data/runtime/ProjectRuntimeSession";
import { hydrateProjectDataFromTagSession } from "./mock-tag-session-state";

const sessions = new Map<string, ProjectRuntimeSession>();

export function getMockRuntimeSession(projectId: string, data?: ProjectData) {
  let session = sessions.get(projectId);
  if (!session) {
    const base = data ?? createEmptyProjectData();
    session = new ProjectRuntimeSession(
      projectId,
      hydrateProjectDataFromTagSession(projectId, base)
    );
    sessions.set(projectId, session);
  }
  return session;
}

export function getMockTagStore(projectId: string, data?: ProjectData) {
  return getMockRuntimeSession(projectId, data).tagStore;
}

/** Live configuration update: preserves current runtime values. */
export function configureMockRuntimeProjectData(
  projectId: string,
  data?: ProjectData
) {
  const resolved = data ?? createEmptyProjectData();
  const session = getMockRuntimeSession(projectId, resolved);
  session.configure(resolved);
  return session;
}

/** Explicit runtime boundary: rehydrate initial/session values. */
export function replaceMockTagStoreData(projectId: string, data?: ProjectData) {
  const base = data ?? createEmptyProjectData();
  const hydrated = hydrateProjectDataFromTagSession(projectId, base);
  const session = getMockRuntimeSession(projectId, hydrated);
  session.reset(hydrated);
  return session.tagStore;
}

export function listMockTagStores() {
  return Array.from(sessions.entries()).map(
    ([projectId, session]) => [projectId, session.tagStore] as const
  );
}
