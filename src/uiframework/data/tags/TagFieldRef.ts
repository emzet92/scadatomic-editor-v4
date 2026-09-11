import type { DataType, PrimitiveDataType } from "../types/DataType";
import type { ProjectData, TagDefinition } from "./TagDefinition";
import { isPrimitiveTag, isUdtTag } from "./TagDefinition";
import type { UdtDefinition, UdtFieldDefinition } from "../udt/UdtDefinition";

export type TagFieldRef = {
  tagId: string;
  fieldIds: string[];
};

export type ResolvedTagFieldRef = {
  ref: TagFieldRef;
  tag: TagDefinition;
  path: string;
  type: PrimitiveDataType;
  field?: UdtFieldDefinition | undefined;
};

export function tagFieldRefKey(ref: TagFieldRef) {
  return `${ref.tagId}:${ref.fieldIds.join("/")}`;
}

export function tagFieldRefsEqual(left: TagFieldRef, right: TagFieldRef) {
  return left.tagId === right.tagId &&
    left.fieldIds.length === right.fieldIds.length &&
    left.fieldIds.every((fieldId, index) => fieldId === right.fieldIds[index]);
}

export function resolveTagFieldRef(
  data: ProjectData,
  ref: TagFieldRef
): ResolvedTagFieldRef | undefined {
  const tag = data.tags[ref.tagId];
  if (!tag) return undefined;

  if (ref.fieldIds.length === 0) {
    if (!isPrimitiveTag(tag)) return undefined;
    return { ref, tag, path: tag.name, type: tag.type };
  }

  if (!isUdtTag(tag)) return undefined;

  let currentType: DataType = tag.type;
  const pathSegments = [tag.name];
  let field: UdtFieldDefinition | undefined;

  for (let index = 0; index < ref.fieldIds.length; index += 1) {
    if (currentType.kind !== "udt") return undefined;
    const definition: UdtDefinition | undefined = data.udts[currentType.udtId];
    if (!definition) return undefined;
    const fieldId = ref.fieldIds[index];
    field = definition.fields.find((candidate: UdtFieldDefinition) => candidate.id === fieldId);
    if (!field) return undefined;
    pathSegments.push(field.name);
    currentType = field.type;
  }

  if (currentType.kind === "udt") return undefined;
  return {
    ref,
    tag,
    path: pathSegments.join("."),
    type: currentType,
    field,
  };
}

export function createTagFieldRef(tagId: string, fieldIds: string[] = []): TagFieldRef {
  return { tagId, fieldIds: [...fieldIds] };
}
