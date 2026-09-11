import type { ProjectData } from "../tags/TagDefinition";
import {
  resolveTagFieldRef,
  tagFieldRefsEqual,
  type TagFieldRef,
} from "../tags/TagFieldRef";
import {
  findSimulationBinding,
  removeSimulationBindingForTarget,
} from "../simulation/SimulationRegistry";
import {
  createEmptyTagSourceConfig,
  type PersistedTagSourceMapping,
  type TagSourceProjectConfig,
} from "./TagSourceBinding";

export type TagSourceDriverKind = string;

export type TagSourceMapping = {
  target: TagFieldRef;
  driver: TagSourceDriverKind;
  mappingId?: string | undefined;
  bindingId?: string | undefined;
  /** False means the value is the built-in Manual fallback, not a persisted mapping. */
  explicit: boolean;
};

export function getTagSourceConfig(data: ProjectData): TagSourceProjectConfig {
  return data.sources ?? createEmptyTagSourceConfig();
}

export function listTagSourceMappings(
  data: ProjectData,
  driver?: string
): PersistedTagSourceMapping[] {
  const mappings = Object.values(getTagSourceConfig(data).mappings);
  return driver ? mappings.filter((mapping) => mapping.driver === driver) : mappings;
}

export function findExplicitTagSourceMapping(
  data: ProjectData,
  target: TagFieldRef
): PersistedTagSourceMapping | undefined {
  return listTagSourceMappings(data).find((mapping) =>
    tagFieldRefsEqual(mapping.target, target)
  );
}

export function getTagSourceMapping(
  data: ProjectData,
  target: TagFieldRef
): TagSourceMapping {
  const explicit = findExplicitTagSourceMapping(data, target);
  if (explicit) {
    const simulation = explicit.driver === "simulation"
      ? findSimulationBinding(data, target)
      : undefined;
    return {
      target,
      driver: explicit.driver,
      mappingId: explicit.id,
      ...(simulation ? { bindingId: simulation.id } : {}),
      explicit: true,
    };
  }

  // Backward-compatible read of projects created before the generic mapping
  // layer existed. The next source edit materializes an explicit mapping.
  const legacySimulation = findSimulationBinding(data, target);
  if (legacySimulation) {
    return {
      target,
      driver: "simulation",
      bindingId: legacySimulation.id,
      explicit: false,
    };
  }

  return { target, driver: "manual", explicit: false };
}

/**
 * Assigns one primitive tag field to exactly one driver. Driver-specific
 * configuration is created/removed by the owning driver adapter, while the
 * source mapping itself remains generic and replaceable.
 */
export function setTagSourceDriver(
  data: ProjectData,
  target: TagFieldRef,
  driver: TagSourceDriverKind
): ProjectData {
  if (!resolveTagFieldRef(data, target)) return data;

  const current = getTagSourceMapping(data, target);
  if (current.driver === driver && current.explicit) return data;

  let next = removeExplicitTagSourceMappingForTarget(data, target);

  if (driver !== "simulation") {
    next = removeSimulationBindingForTarget(next, target);
  }

  const mapping: PersistedTagSourceMapping = {
    id: current.mappingId ?? crypto.randomUUID(),
    target: { tagId: target.tagId, fieldIds: [...target.fieldIds] },
    driver,
  };

  return upsertExplicitTagSourceMapping(next, mapping);
}

/** Removes explicit ownership and returns the field to the Manual fallback. */
export function clearTagSourceDriverMapping(
  data: ProjectData,
  target: TagFieldRef
): ProjectData {
  const current = getTagSourceMapping(data, target);
  let next = removeExplicitTagSourceMappingForTarget(data, target);
  if (current.driver === "simulation") {
    next = removeSimulationBindingForTarget(next, target);
  }
  return next;
}

export function removeTagSourceMappingsForTag(
  data: ProjectData,
  tagId: string
): ProjectData {
  return filterExplicitMappings(data, (mapping) => mapping.target.tagId !== tagId);
}

export function pruneInvalidTagSourceMappings(data: ProjectData): ProjectData {
  return filterExplicitMappings(data, (mapping) => !!resolveTagFieldRef(data, mapping.target));
}

function upsertExplicitTagSourceMapping(
  data: ProjectData,
  mapping: PersistedTagSourceMapping
): ProjectData {
  const current = getTagSourceConfig(data);
  return {
    ...data,
    sources: {
      ...current,
      mappings: {
        ...current.mappings,
        [mapping.id]: mapping,
      },
    },
  };
}

function removeExplicitTagSourceMappingForTarget(
  data: ProjectData,
  target: TagFieldRef
): ProjectData {
  return filterExplicitMappings(
    data,
    (mapping) => !tagFieldRefsEqual(mapping.target, target)
  );
}

function filterExplicitMappings(
  data: ProjectData,
  predicate: (mapping: PersistedTagSourceMapping) => boolean
): ProjectData {
  const current = getTagSourceConfig(data);
  const mappings = Object.fromEntries(
    Object.entries(current.mappings).filter(([, mapping]) => predicate(mapping))
  );
  if (Object.keys(mappings).length === Object.keys(current.mappings).length) {
    return data;
  }
  return { ...data, sources: { ...current, mappings } };
}
