import { isUdtTag, type ProjectData, type UdtTag } from "../tags/TagDefinition";
import type { DataType } from "../types/DataType";
import { TypeRegistry } from "../types/TypeRegistry";
import { createFieldDefaultValue } from "./UdtInstanceFactory";
import type {
  UdtDefinition,
  UdtFieldDefinition,
  UdtMethodDefinition,
} from "./UdtDefinition";

export function createUdtDefinition(name: string): UdtDefinition {
  return { id: crypto.randomUUID(), name, fields: [], methods: [] };
}

export function addUdtField(
  data: ProjectData,
  udtId: string,
  input: { name: string; type: DataType; defaultValue?: unknown }
): ProjectData {
  const definition = requireUdt(data, udtId);
  const field: UdtFieldDefinition = {
    id: crypto.randomUUID(),
    name: input.name,
    type: input.type,
    ...(input.defaultValue !== undefined ? { defaultValue: input.defaultValue } : {}),
  };
  const nextDefinition = { ...definition, fields: [...definition.fields, field] };
  return updateDefinitionAndInstances(data, definition, nextDefinition);
}

export function updateUdtField(
  data: ProjectData,
  udtId: string,
  fieldId: string,
  updater: (field: UdtFieldDefinition) => UdtFieldDefinition
): ProjectData {
  const definition = requireUdt(data, udtId);
  const nextDefinition = {
    ...definition,
    fields: definition.fields.map((field) =>
      field.id === fieldId ? updater(field) : field
    ),
  };
  return updateDefinitionAndInstances(data, definition, nextDefinition);
}

export function deleteUdtField(
  data: ProjectData,
  udtId: string,
  fieldId: string
): ProjectData {
  const definition = requireUdt(data, udtId);
  const nextDefinition = {
    ...definition,
    fields: definition.fields.filter((field) => field.id !== fieldId),
  };
  return updateDefinitionAndInstances(data, definition, nextDefinition);
}

export function addUdtMethod(
  data: ProjectData,
  udtId: string,
  name: string,
  source = "// self is the current UDT instance\n"
): ProjectData {
  const definition = requireUdt(data, udtId);
  const method: UdtMethodDefinition = { id: crypto.randomUUID(), name, source };
  return replaceUdt(data, { ...definition, methods: [...definition.methods, method] });
}

export function updateUdtMethod(
  data: ProjectData,
  udtId: string,
  methodId: string,
  updater: (method: UdtMethodDefinition) => UdtMethodDefinition
): ProjectData {
  const definition = requireUdt(data, udtId);
  return replaceUdt(data, {
    ...definition,
    methods: definition.methods.map((method) =>
      method.id === methodId ? updater(method) : method
    ),
  });
}

export function deleteUdtMethod(data: ProjectData, udtId: string, methodId: string) {
  const definition = requireUdt(data, udtId);
  return replaceUdt(data, {
    ...definition,
    methods: definition.methods.filter((method) => method.id !== methodId),
  });
}

export function renameUdt(data: ProjectData, udtId: string, name: string) {
  const definition = requireUdt(data, udtId);
  return replaceUdt(data, { ...definition, name });
}

export function getUdtDependents(data: ProjectData, udtId: string) {
  return Object.values(data.tags).filter(
    (tag): tag is UdtTag => isUdtTag(tag) && tag.type.udtId === udtId
  );
}

export function deleteUdt(data: ProjectData, udtId: string): ProjectData {
  if (getUdtDependents(data, udtId).length > 0) {
    throw new Error("Cannot delete a UDT that is used by tags.");
  }
  const udts = { ...data.udts };
  delete udts[udtId];
  return { ...data, udts };
}

function updateDefinitionAndInstances(
  data: ProjectData,
  previous: UdtDefinition,
  next: UdtDefinition
): ProjectData {
  const nextData = replaceUdt(data, next);
  const tags = { ...nextData.tags };

  for (const [tagId, tag] of Object.entries(tags)) {
    if (!isUdtTag(tag) || tag.type.udtId !== next.id) continue;
    tags[tagId] = synchronizeInstance(tag, previous, next, nextData);
  }

  return { ...nextData, tags };
}

function synchronizeInstance(
  tag: UdtTag,
  previous: UdtDefinition,
  next: UdtDefinition,
  data: ProjectData
): UdtTag {
  const previousById = new Map(previous.fields.map((field) => [field.id, field]));
  const values: Record<string, unknown> = {};

  for (const field of next.fields) {
    const oldField = previousById.get(field.id);
    const oldValue = oldField ? tag.values[oldField.name] : undefined;
    const canKeep =
      oldField !== undefined &&
      dataTypeCompatible(field.type, oldField.type) &&
      isValueCompatible(field.type, oldValue, data);

    values[field.name] = canKeep
      ? oldValue
      : createFieldDefaultValue(field.type, field.defaultValue, data);
  }

  return { ...tag, values };
}

function isValueCompatible(type: DataType, value: unknown, data: ProjectData) {
  if (type.kind !== "udt") return TypeRegistry.validate(type, value);
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return !!data.udts[type.udtId];
}

function dataTypeCompatible(left: DataType, right: DataType) {
  return left.kind === right.kind &&
    (left.kind !== "udt" || (right.kind === "udt" && left.udtId === right.udtId));
}

function requireUdt(data: ProjectData, udtId: string) {
  const definition = data.udts[udtId];
  if (!definition) throw new Error(`Unknown UDT: ${udtId}`);
  return definition;
}

function replaceUdt(data: ProjectData, definition: UdtDefinition): ProjectData {
  return {
    ...data,
    udts: { ...data.udts, [definition.id]: definition },
  };
}
