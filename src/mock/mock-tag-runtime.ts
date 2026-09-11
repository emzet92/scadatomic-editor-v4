import { TagStore } from "../uiframework/data/tags/TagStore";
import {
  createEmptyProjectData,
  type ProjectData,
} from "../uiframework/data/tags/TagDefinition";
import { hydrateProjectDataFromTagSession } from "./mock-tag-session-state";

const stores = new Map<string, TagStore>();

export function getMockTagStore(projectId: string, data?: ProjectData) {
  let store = stores.get(projectId);
  if (!store) {
    const base = data ?? createEmptyProjectData();
    store = new TagStore(hydrateProjectDataFromTagSession(projectId, base));
    stores.set(projectId, store);
  }
  return store;
}

export function replaceMockTagStoreData(projectId: string, data?: ProjectData) {
  const base = data ?? createEmptyProjectData();
  const hydrated = hydrateProjectDataFromTagSession(projectId, base);
  const store = getMockTagStore(projectId, hydrated);
  store.replaceData(hydrated);
  return store;
}

export function listMockTagStores(): Array<[string, TagStore]> {
  return Array.from(stores.entries());
}
