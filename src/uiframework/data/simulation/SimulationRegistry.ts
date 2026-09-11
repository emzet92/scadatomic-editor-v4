import type { ProjectData } from "../tags/TagDefinition";
import { resolveTagFieldRef, tagFieldRefsEqual, type TagFieldRef } from "../tags/TagFieldRef";
import type {
  SimulationBinding,
  SimulationGeneratorConfig,
  SimulationGeneratorKind,
  SimulationProjectConfig,
} from "./SimulationBinding";
import { createEmptySimulationConfig } from "./SimulationBinding";
import { simulationGeneratorRegistry } from "./SimulationGeneratorRegistry";
import type { SimulationActivation } from "./SimulationActivation";

export function getSimulationConfig(data: ProjectData): SimulationProjectConfig {
  return data.simulation ?? createEmptySimulationConfig();
}

export function listSimulationBindings(data: ProjectData) {
  return Object.values(getSimulationConfig(data).bindings);
}

export function findSimulationBinding(data: ProjectData, target: TagFieldRef) {
  return listSimulationBindings(data).find((binding) =>
    tagFieldRefsEqual(binding.target, target)
  );
}

export function createSimulationBinding(
  data: ProjectData,
  target: TagFieldRef,
  generatorKind?: SimulationGeneratorKind
): SimulationBinding {
  const resolved = resolveTagFieldRef(data, target);
  if (!resolved) throw new Error("Cannot simulate an unknown or non-primitive tag field.");
  const descriptors = simulationGeneratorRegistry.listForType(resolved.type.kind);
  const descriptor = generatorKind
    ? descriptors.find((candidate) => candidate.kind === generatorKind)
    : descriptors[0];
  if (!descriptor) throw new Error(`No simulation generators support ${resolved.type.kind}.`);

  return {
    id: crypto.randomUUID(),
    driver: "simulation",
    target: { tagId: target.tagId, fieldIds: [...target.fieldIds] },
    enabled: true,
    generator: simulationGeneratorRegistry.createDefault(
      descriptor.kind,
      resolved.type.kind
    ),
  };
}

export function upsertSimulationBinding(
  data: ProjectData,
  binding: SimulationBinding
): ProjectData {
  return {
    ...data,
    simulation: {
      ...getSimulationConfig(data),
      bindings: {
        ...getSimulationConfig(data).bindings,
        [binding.id]: binding,
      },
    },
  };
}

export function updateSimulationBinding(
  data: ProjectData,
  bindingId: string,
  updater: (binding: SimulationBinding) => SimulationBinding
): ProjectData {
  const current = getSimulationConfig(data).bindings[bindingId];
  if (!current) return data;
  return upsertSimulationBinding(data, updater(current));
}

export function removeSimulationBinding(data: ProjectData, bindingId: string): ProjectData {
  const current = getSimulationConfig(data);
  if (!current.bindings[bindingId]) return data;
  const bindings = { ...current.bindings };
  delete bindings[bindingId];
  return { ...data, simulation: { ...current, bindings } };
}

export function removeSimulationBindingForTarget(
  data: ProjectData,
  target: TagFieldRef
): ProjectData {
  return filterSimulationBindings(
    data,
    (binding) => !tagFieldRefsEqual(binding.target, target)
  );
}

export function removeSimulationBindingsForTag(data: ProjectData, tagId: string): ProjectData {
  return filterSimulationBindings(data, (binding) => binding.target.tagId !== tagId);
}

export function pruneInvalidSimulationBindings(data: ProjectData): ProjectData {
  return filterSimulationBindings(data, (binding) => {
    const resolved = resolveTagFieldRef(data, binding.target);
    return !!resolved && simulationGeneratorRegistry.supports(
      binding.generator.kind,
      resolved.type.kind
    );
  });
}

export function replaceSimulationGenerator(
  data: ProjectData,
  bindingId: string,
  kind: SimulationGeneratorKind
): ProjectData {
  return updateSimulationBinding(data, bindingId, (binding) => {
    const resolved = resolveTagFieldRef(data, binding.target);
    if (!resolved) return binding;
    return {
      ...binding,
      generator: simulationGeneratorRegistry.createDefault(kind, resolved.type.kind),
    };
  });
}

export function updateSimulationGenerator(
  data: ProjectData,
  bindingId: string,
  generator: SimulationGeneratorConfig
) {
  return updateSimulationBinding(data, bindingId, (binding) => ({
    ...binding,
    generator,
  }));
}

export function updateSimulationActivation(
  data: ProjectData,
  bindingId: string,
  activation: SimulationActivation | undefined
) {
  return updateSimulationBinding(data, bindingId, (binding) => {
    if (activation) return { ...binding, activation };
    const withoutActivation = { ...binding };
    delete withoutActivation.activation;
    return withoutActivation;
  });
}

function filterSimulationBindings(
  data: ProjectData,
  predicate: (binding: SimulationBinding) => boolean
): ProjectData {
  const current = getSimulationConfig(data);
  const bindings = Object.fromEntries(
    Object.entries(current.bindings).filter(([, binding]) => predicate(binding))
  );
  if (Object.keys(bindings).length === Object.keys(current.bindings).length) return data;
  return { ...data, simulation: { ...current, bindings } };
}
