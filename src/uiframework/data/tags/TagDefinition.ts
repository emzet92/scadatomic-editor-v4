import type { PrimitiveDataType, UdtDataType } from "../types/DataType";

export type PrimitiveTag = {
  id: string;
  name: string;
  type: PrimitiveDataType;
  value: unknown;
};

export type UdtTag = {
  id: string;
  name: string;
  type: UdtDataType;
  values: Record<string, unknown>;
};

export type TagDefinition = PrimitiveTag | UdtTag;

export type ProjectData = {
  udts: Record<string, import("../udt/UdtDefinition").UdtDefinition>;
  tags: Record<string, TagDefinition>;
};

export function createEmptyProjectData(): ProjectData {
  return { udts: {}, tags: {} };
}

export function isUdtTag(tag: TagDefinition): tag is UdtTag {
  return tag.type.kind === "udt";
}

export function isPrimitiveTag(tag: TagDefinition): tag is PrimitiveTag {
  return tag.type.kind !== "udt";
}
