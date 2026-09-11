import type { DataType } from "../types/DataType";
import { TypeRegistry } from "../types/TypeRegistry";
import type { UdtDefinition } from "../udt/UdtDefinition";
import type { ProjectData, TagDefinition } from "../tags/TagDefinition";

export function isProjectData(value: unknown): value is ProjectData {
  if (!isRecord(value) || !isRecord(value.udts) || !isRecord(value.tags)) return false;

  const udts = value.udts as Record<string, unknown>;
  if (!Object.entries(udts).every(([id, udt]) => isUdtDefinition(udt, id))) {
    return false;
  }

  const tagsValid = Object.entries(value.tags).every(([id, tag]) =>
    isTagDefinition(tag, id, udts as Record<string, UdtDefinition>)
  );
  if (!tagsValid) return false;

  const sourcesValid = value.sources === undefined || isTagSourceConfig(value.sources);
  const simulationValid = value.simulation === undefined || isSimulationConfig(value.simulation);
  return sourcesValid && simulationValid;
}

function isUdtDefinition(value: unknown, expectedId: string): value is UdtDefinition {
  if (!isRecord(value)) return false;
  if (
    value.id !== expectedId ||
    typeof value.name !== "string" ||
    !isJsIdentifier(value.name) ||
    !Array.isArray(value.fields) ||
    !Array.isArray(value.methods)
  ) return false;

  const fieldIds = new Set<string>();
  const fieldNames = new Set<string>();
  for (const field of value.fields) {
    if (!isRecord(field) || typeof field.id !== "string" || typeof field.name !== "string") return false;
    if (!isJsIdentifier(field.name) || fieldIds.has(field.id) || fieldNames.has(field.name)) return false;
    if (!isDataType(field.type)) return false;
    fieldIds.add(field.id);
    fieldNames.add(field.name);
  }

  const methodIds = new Set<string>();
  const methodNames = new Set<string>();
  for (const method of value.methods) {
    if (
      !isRecord(method) ||
      typeof method.id !== "string" ||
      typeof method.name !== "string" ||
      typeof method.source !== "string" ||
      !isJsIdentifier(method.name) ||
      methodIds.has(method.id) ||
      methodNames.has(method.name)
    ) return false;
    methodIds.add(method.id);
    methodNames.add(method.name);
  }

  return true;
}

function isTagDefinition(
  value: unknown,
  expectedId: string,
  udts: Record<string, UdtDefinition>
): value is TagDefinition {
  if (!isRecord(value) || value.id !== expectedId || typeof value.name !== "string" || !isJsIdentifier(value.name) || !isDataType(value.type)) {
    return false;
  }

  const type = value.type as DataType;
  if (type.kind === "udt") {
    return !!udts[type.udtId] && isRecord(value.values);
  }

  return TypeRegistry.validate(type, value.value);
}


function isTagSourceConfig(value: unknown) {
  if (!isRecord(value) || !isRecord(value.mappings)) return false;
  return Object.entries(value.mappings).every(([id, mapping]) => {
    if (!isRecord(mapping) || mapping.id !== id || typeof mapping.driver !== "string") return false;
    return isTagFieldRef(mapping.target);
  });
}

function isTagFieldRef(value: unknown) {
  return isRecord(value) &&
    typeof value.tagId === "string" &&
    Array.isArray(value.fieldIds) &&
    value.fieldIds.every((fieldId) => typeof fieldId === "string");
}

function isSimulationConfig(value: unknown) {
  if (!isRecord(value) || !isRecord(value.bindings)) return false;
  return Object.entries(value.bindings).every(([id, binding]) => {
    if (!isRecord(binding) || binding.id !== id || binding.driver !== "simulation" || typeof binding.enabled !== "boolean") return false;
    if (!isTagFieldRef(binding.target)) return false;
    if (!isSimulationGeneratorConfig(binding.generator)) return false;
    return binding.activation === undefined || isSimulationActivation(binding.activation);
  });
}

function isSimulationActivation(value: unknown) {
  if (!isRecord(value) || !isRecord(value.condition) || !isRecord(value.inactiveBehavior)) return false;
  const condition = value.condition;
  if (!isTagFieldRef(condition.source)) return false;
  if (condition.operator !== "eq" && condition.operator !== "neq") return false;
  if (!isPrimitiveValue(condition.value)) return false;

  const inactive = value.inactiveBehavior;
  if (inactive.kind === "hold") return true;
  return inactive.kind === "set" && isPrimitiveValue(inactive.value);
}

function isPrimitiveValue(value: unknown) {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function isSimulationGeneratorConfig(value: unknown) {
  if (!isRecord(value) || typeof value.kind !== "string") return false;
  switch (value.kind) {
    case "constant":
      return typeof value.value === "string" || typeof value.value === "number" || typeof value.value === "boolean";
    case "sine":
      return numbers(value, ["min", "max", "periodMs", "phase"]);
    case "ramp":
      return numbers(value, ["min", "max", "durationMs"]) && (value.mode === "loop" || value.mode === "pingPong");
    case "square":
      return numbers(value, ["low", "high", "periodMs", "dutyCycle"]);
    case "random":
      return numbers(value, ["min", "max", "intervalMs"]) && (value.seed === undefined || typeof value.seed === "number");
    case "toggle":
      return typeof value.intervalMs === "number" && typeof value.initialValue === "boolean";
    default:
      return false;
  }
}

function numbers(value: Record<string, unknown>, keys: string[]) {
  return keys.every((key) => typeof value[key] === "number" && Number.isFinite(value[key]));
}

function isDataType(value: unknown): value is DataType {
  if (!isRecord(value) || typeof value.kind !== "string") return false;
  if (value.kind === "string" || value.kind === "int" || value.kind === "bool") return true;
  return value.kind === "udt" && typeof value.udtId === "string";
}

function isJsIdentifier(value: string) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
