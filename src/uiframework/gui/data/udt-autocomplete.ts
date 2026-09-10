import { isUdtTag, type ProjectData } from "../../data/tags/TagDefinition";
import type { UdtDefinition } from "../../data/udt/UdtDefinition";
import type { AutocompleteApiNode } from "../script-editor/ctx-completions";

export function createUdtSelfAutocompleteRoot(
  definition: UdtDefinition
): AutocompleteApiNode {
  return {
    label: "self",
    completionType: "class",
    detail: definition.name,
    children: createUdtMemberNodes(definition),
  };
}

export function createUdtTagAutocompleteRoots(
  data: ProjectData | undefined
): AutocompleteApiNode[] {
  if (!data) return [];
  return Object.values(data.tags)
    .filter(isUdtTag)
    .flatMap((tag): AutocompleteApiNode[] => {
      const definition = data.udts[tag.type.udtId];
      if (!definition) return [];
      return [{
        label: tag.name,
        completionType: "class",
        detail: `${definition.name} tag`,
        children: createUdtMemberNodes(definition),
      }];
    });
}

function createUdtMemberNodes(definition: UdtDefinition): AutocompleteApiNode[] {
  return [
    ...definition.fields.map((field) => ({
      label: field.name,
      completionType: "property",
      detail: `${field.type.kind} · read/write`,
    })),
    ...definition.methods.map((method) => ({
      label: method.name,
      completionType: "method",
      detail: "UDT method",
    })),
  ];
}
