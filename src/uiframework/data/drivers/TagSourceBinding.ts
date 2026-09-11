import type { TagFieldRef } from "../tags/TagFieldRef";

/**
 * Persisted, driver-agnostic ownership of a primitive tag field.
 * Driver-specific configuration lives in the owning driver module.
 */
export type PersistedTagSourceMapping = {
  id: string;
  target: TagFieldRef;
  driver: string;
};

export type TagSourceProjectConfig = {
  mappings: Record<string, PersistedTagSourceMapping>;
};

export function createEmptyTagSourceConfig(): TagSourceProjectConfig {
  return { mappings: {} };
}
