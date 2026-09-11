import { isUdtTag, type ProjectData, type TagDefinition } from "../tags/TagDefinition";

export type TagRef = {
  kind: "tagRef";
  tagId: string;
  udtId: string;
};

export function createTagRef(tag: TagDefinition): TagRef | undefined {
  return isUdtTag(tag)
    ? { kind: "tagRef", tagId: tag.id, udtId: tag.type.udtId }
    : undefined;
}

export function isTagRef(value: unknown): value is TagRef {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.kind === "tagRef" &&
    typeof candidate.tagId === "string" &&
    typeof candidate.udtId === "string"
  );
}

export function resolveTagRef(data: ProjectData | undefined, ref: TagRef) {
  const tag = data?.tags[ref.tagId];
  return tag && isUdtTag(tag) && tag.type.udtId === ref.udtId ? tag : undefined;
}
