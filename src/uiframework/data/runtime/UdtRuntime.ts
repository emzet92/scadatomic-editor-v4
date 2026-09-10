import { isPrimitiveTag, type ProjectData } from "../tags/TagDefinition";
import type { UdtDefinition } from "../udt/UdtDefinition";
export {
  createTagRuntimeGlobals,
  createTagRuntimeProxy,
  createUdtInstanceApi,
  createTagRuntimeGlobals as createUdtRuntimeGlobals,
  type TagRuntimeApi,
  type TagRuntimeContext as UdtMethodContext,
  type UdtInstanceApi,
} from "./TagRuntimeProxy";

export function flattenTagValues(data: ProjectData): Array<[string, unknown]> {
  const values: Array<[string, unknown]> = [];
  for (const tag of Object.values(data.tags)) {
    if (isPrimitiveTag(tag)) {
      values.push([tag.name, tag.value]);
      continue;
    }
    const definition = data.udts[tag.type.udtId];
    if (!definition) continue;
    flattenUdtValues(tag.name, tag.values, definition, data, values);
  }
  return values;
}

function flattenUdtValues(
  prefix: string,
  values: Record<string, unknown>,
  definition: UdtDefinition,
  data: ProjectData,
  output: Array<[string, unknown]>
) {
  for (const field of definition.fields) {
    const path = `${prefix}.${field.name}`;
    if (field.type.kind === "udt") {
      const nestedDefinition = data.udts[field.type.udtId];
      const nestedValues = values[field.name];
      if (nestedDefinition && isRecord(nestedValues)) {
        flattenUdtValues(path, nestedValues, nestedDefinition, data, output);
      }
    } else {
      output.push([path, values[field.name]]);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
