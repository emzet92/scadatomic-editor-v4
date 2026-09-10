import type { ProjectData, UdtTag } from "../tags/TagDefinition";
import { TypeRegistry } from "../types/TypeRegistry";
import type { UdtDefinition } from "./UdtDefinition";

export function createUdtInstanceValues(
  definition: UdtDefinition,
  data: Pick<ProjectData, "udts">
): Record<string, unknown> {
  return Object.fromEntries(
    definition.fields.map((field) => [
      field.name,
      createFieldDefaultValue(field.type, field.defaultValue, data),
    ])
  );
}

export function createUdtTag(
  name: string,
  definition: UdtDefinition,
  data: Pick<ProjectData, "udts">
): UdtTag {
  return {
    id: crypto.randomUUID(),
    name,
    type: { kind: "udt", udtId: definition.id },
    values: createUdtInstanceValues(definition, data),
  };
}

export function createFieldDefaultValue(
  type: import("../types/DataType").DataType,
  configuredDefault: unknown,
  data: Pick<ProjectData, "udts">
): unknown {
  if (type.kind === "udt") {
    const nested = data.udts[type.udtId];
    return nested ? createUdtInstanceValues(nested, data) : {};
  }

  if (configuredDefault !== undefined && TypeRegistry.validate(type, configuredDefault)) {
    return structuredClone(configuredDefault);
  }

  return TypeRegistry.getDefaultValue(type);
}
