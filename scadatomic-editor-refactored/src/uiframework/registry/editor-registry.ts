import type { ElementType } from "react";
import { componentDefinitions } from "./component-definitions";

export type ScadatomicComponent = ElementType;
export type ComponentRegistry = Record<string, ScadatomicComponent>;

export const editorRegistry: ComponentRegistry = Object.fromEntries(
  Object.values(componentDefinitions).map((definition) => [
    definition.type,
    definition.editor,
  ])
);
