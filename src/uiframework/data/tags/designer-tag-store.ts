import { useSyncExternalStore } from "react";
import { createEmptyProjectData, type ProjectData } from "./TagDefinition";
import { TagStore } from "./TagStore";

export const designerTagStore = new TagStore(createEmptyProjectData());

export function replaceDesignerTagData(data: ProjectData | undefined) {
  designerTagStore.replaceData(data ?? createEmptyProjectData());
}

export function useDesignerTagValue(path: string | undefined) {
  return useSyncExternalStore(
    (listener) =>
      path
        ? designerTagStore.subscribe(path, () => listener())
        : () => undefined,
    () => (path ? designerTagStore.get(path) : undefined),
    () => undefined
  );
}
