import type { ComponentRegistry } from "./editor-registry";
import { componentDefinitions } from "./component-definitions";

export const runtimeRegistry: ComponentRegistry = Object.fromEntries(
  Object.values(componentDefinitions).map((definition) => [
    definition.type,
    definition.runtime,
  ])
);
