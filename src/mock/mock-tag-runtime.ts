import { TagStore } from "../uiframework/data/tags/TagStore";
import { createEmptyProjectData, type ProjectData } from "../uiframework/data/tags/TagDefinition";

const stores = new Map<string, TagStore>();

export function getMockTagStore(projectId: string, data?: ProjectData) {
  let store = stores.get(projectId);
  if (!store) {
    store = new TagStore(data ?? createEmptyProjectData());
    stores.set(projectId, store);
  }
  return store;
}

export function replaceMockTagStoreData(projectId: string, data?: ProjectData) {
  const store = getMockTagStore(projectId, data);
  store.replaceData(data ?? createEmptyProjectData());
  return store;
}

export function listMockTagStores(): Array<[string, TagStore]> {
  return Array.from(stores.entries());
}
