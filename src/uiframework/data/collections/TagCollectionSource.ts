import { isUdtTag, type ProjectData } from "../tags/TagDefinition";
import { createTagRef, type TagRef } from "./TagRef";

export type TagsByUdtSource = {
  kind: "tagsByUdt";
  udtId: string;
};

export type TagCollectionSource = TagsByUdtSource;

export function resolveTagCollection(
  data: ProjectData | undefined,
  source: TagCollectionSource
): TagRef[] {
  if (!data) return [];

  switch (source.kind) {
    case "tagsByUdt":
      return Object.values(data.tags)
        .filter((tag) => isUdtTag(tag) && tag.type.udtId === source.udtId)
        .map(createTagRef)
        .filter((ref): ref is TagRef => !!ref);
  }
}

export function isTagCollectionSource(value: unknown): value is TagCollectionSource {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return candidate.kind === "tagsByUdt" && typeof candidate.udtId === "string";
}
