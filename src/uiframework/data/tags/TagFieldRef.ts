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

/** Lists every primitive runtime leaf using stable ids plus its display path. */
export function listPrimitiveTagFieldRefs(data: ProjectData): ResolvedTagFieldRef[] {
  const result: ResolvedTagFieldRef[] = [];

  for (const tag of Object.values(data.tags)) {
    if (isPrimitiveTag(tag)) {
      result.push({ ref: createTagFieldRef(tag.id), tag, path: tag.name, type: tag.type });
      continue;
    }

    collectUdtPrimitiveRefs(data, tag, tag.type, [], [tag.name], result);
  }

  return result;
}

export function findTagFieldRefByPath(
  data: ProjectData,
  path: string
): ResolvedTagFieldRef | undefined {
  return listPrimitiveTagFieldRefs(data).find((candidate) => candidate.path === path);
}

function collectUdtPrimitiveRefs(
  data: ProjectData,
  tag: TagDefinition,
  type: DataType,
  fieldIds: string[],
  pathSegments: string[],
  output: ResolvedTagFieldRef[]
) {
  if (type.kind !== "udt") return;
  const definition = data.udts[type.udtId];
  if (!definition) return;

  for (const field of definition.fields) {
    const nextFieldIds = [...fieldIds, field.id];
    const nextPathSegments = [...pathSegments, field.name];
    if (field.type.kind === "udt") {
      collectUdtPrimitiveRefs(
        data,
        tag,
        field.type,
        nextFieldIds,
        nextPathSegments,
        output
      );
      continue;
    }

    output.push({
      ref: createTagFieldRef(tag.id, nextFieldIds),
      tag,
      path: nextPathSegments.join("."),
      type: field.type,
      field,
    });
  }
}
