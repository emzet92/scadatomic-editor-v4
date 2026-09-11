import type { ProjectData } from "../tags/TagDefinition";
import type { TagFieldRef } from "../tags/TagFieldRef";
import {
  createSimulationBinding,
  findSimulationBinding,
  removeSimulationBindingForTarget,
  upsertSimulationBinding,
} from "../simulation/SimulationRegistry";

export type TagSourceDriverKind = "manual" | "simulation";

export type TagSourceMapping = {
  target: TagFieldRef;
  driver: TagSourceDriverKind;
  bindingId?: string | undefined;
};

export function getTagSourceMapping(
  data: ProjectData,
  target: TagFieldRef
): TagSourceMapping {
  const simulation = findSimulationBinding(data, target);
  return simulation
    ? { target, driver: "simulation", bindingId: simulation.id }
    : { target, driver: "manual" };
}

/**
 * Changes only the source mapping. Runtime values always remain owned by
 * TagStore. Selecting Manual removes the persisted simulation binding;
 * selecting Simulation creates one with registry defaults.
 */
export function setTagSourceDriver(
  data: ProjectData,
  target: TagFieldRef,
  driver: TagSourceDriverKind
): ProjectData {
  const current = getTagSourceMapping(data, target);
  if (current.driver === driver) return data;

  if (driver === "manual") {
    return removeSimulationBindingForTarget(data, target);
  }

  return upsertSimulationBinding(data, createSimulationBinding(data, target));
}
