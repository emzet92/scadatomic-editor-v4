import type { PrimitiveDataType } from "../types/DataType";
import { TypeRegistry } from "../types/TypeRegistry";
import { createUdtTag } from "../udt/UdtInstanceFactory";
import type { ProjectData, PrimitiveTag, TagDefinition } from "./TagDefinition";

export const RESERVED_DATA_NAMES = new Set(["ctx", "self", "internal", "args", "tags", "$get", "$set", "$children"]);

export function validateDataName(
  data: ProjectData,
  name: string,
  options: { kind: "tag" | "udt"; ignoreId?: string } = { kind: "tag" }
): string | null {
  const trimmed = name.trim();
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(trimmed)) {
    return "Use a valid JavaScript identifier.";
  }
  if (RESERVED_DATA_NAMES.has(trimmed)) {
    return `“${trimmed}” is reserved by the script runtime.`;
  }

  const collection = options.kind === "tag" ? data.tags : data.udts;
  if (
    Object.values(collection).some(
      (entry) => entry.id !== options.ignoreId && entry.name === trimmed
    )
  ) {
    return `${options.kind === "tag" ? "Tag" : "UDT"} name must be unique.`;
  }
  return null;
}

export function createPrimitiveTag(
  data: ProjectData,
  name: string,
  type: PrimitiveDataType,
  value?: unknown
): ProjectData {
  const error = validateDataName(data, name, { kind: "tag" });
  if (error) throw new Error(error);
  const resolvedValue =
    value !== undefined && TypeRegistry.validate(type, value)
      ? value
      : TypeRegistry.getDefaultValue(type);
  const tag: PrimitiveTag = {
    id: crypto.randomUUID(),
    name: name.trim(),
    type,
    value: resolvedValue,
  };
  return { ...data, tags: { ...data.tags, [tag.id]: tag } };
}

export function createTagFromUdt(
  data: ProjectData,
  name: string,
  udtId: string
): ProjectData {
  const error = validateDataName(data, name, { kind: "tag" });
  if (error) throw new Error(error);
  const definition = data.udts[udtId];
  if (!definition) throw new Error("Unknown UDT definition.");
  const tag = createUdtTag(name.trim(), definition, data);
  return { ...data, tags: { ...data.tags, [tag.id]: tag } };
}

export function renameTag(data: ProjectData, tagId: string, name: string): ProjectData {
  const tag = data.tags[tagId];
  if (!tag) return data;
  const error = validateDataName(data, name, { kind: "tag", ignoreId: tagId });
  if (error) throw new Error(error);
  return {
    ...data,
    tags: { ...data.tags, [tagId]: { ...tag, name: name.trim() } as TagDefinition },
  };
}

export function deleteTag(data: ProjectData, tagId: string): ProjectData {
  if (!data.tags[tagId]) return data;
  const tags = { ...data.tags };
  delete tags[tagId];
  return { ...data, tags };
}
