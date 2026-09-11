import type { TagStore } from "../tags/TagStore";
import {
  resolveTagFieldRef,
  type TagFieldRef,
} from "../tags/TagFieldRef";
import type { ProjectData } from "../tags/TagDefinition";
import type { PrimitiveDataType } from "../types/DataType";
import { TypeRegistry } from "../types/TypeRegistry";

export type SimulationConditionOperator = "eq" | "neq";

export type SimulationCondition = {
  source: TagFieldRef;
  operator: SimulationConditionOperator;
  value: string | number | boolean;
};

export type SimulationInactiveBehavior =
  | { kind: "hold" }
  | { kind: "set"; value: string | number | boolean };

export type SimulationActivation = {
  condition: SimulationCondition;
  inactiveBehavior: SimulationInactiveBehavior;
};

export type SimulationActivationEvaluation =
  | { ok: true; active: boolean; sourcePath: string }
  | { ok: false; message: string };

export function createDefaultSimulationActivation(
  data: ProjectData,
  source: TagFieldRef,
  targetType: PrimitiveDataType
): SimulationActivation {
  const resolved = resolveTagFieldRef(data, source);
  if (!resolved) throw new Error("Cannot create an activation condition for an unknown tag field.");
  return {
    condition: {
      source: { tagId: source.tagId, fieldIds: [...source.fieldIds] },
      operator: "eq",
      value: resolved.type.kind === "bool" ? true : TypeRegistry.getDefaultValue(resolved.type),
    },
    inactiveBehavior: {
      kind: "set",
      value: TypeRegistry.getDefaultValue(targetType),
    },
  };
}

export function validateSimulationActivation(
  data: ProjectData,
  targetType: PrimitiveDataType,
  activation: SimulationActivation
): string | null {
  const source = resolveTagFieldRef(data, activation.condition.source);
  if (!source) return "Activation source no longer exists.";
  if (!TypeRegistry.validate(source.type, activation.condition.value)) {
    return `Activation value must be a valid ${TypeRegistry.getDisplayName(source.type)}.`;
  }
  if (activation.inactiveBehavior.kind === "set" && !TypeRegistry.validate(targetType, activation.inactiveBehavior.value)) {
    return `Inactive value must be a valid ${TypeRegistry.getDisplayName(targetType)}.`;
  }
  return null;
}

export function evaluateSimulationActivation(
  data: ProjectData,
  tagStore: TagStore,
  activation: SimulationActivation
): SimulationActivationEvaluation {
  const source = resolveTagFieldRef(data, activation.condition.source);
  if (!source) return { ok: false, message: "Activation source no longer exists." };

  const currentValue = tagStore.get(source.path);
  const equal = Object.is(currentValue, activation.condition.value);
  return {
    ok: true,
    active: activation.condition.operator === "eq" ? equal : !equal,
    sourcePath: source.path,
  };
}
