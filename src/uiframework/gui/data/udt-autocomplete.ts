import {
  isPrimitiveTag,
  isUdtTag,
  type ProjectData,
  type TagDefinition,
} from "../../data/tags/TagDefinition";
import type { UdtDefinition } from "../../data/udt/UdtDefinition";
import type { AutocompleteApiNode } from "../script-editor/ctx-completions";

export function createUdtSelfAutocompleteRoot(
  definition: UdtDefinition,
  data?: ProjectData
): AutocompleteApiNode {
  return {
    label: "self",
    completionType: "class",
    detail: definition.name,
    children: createUdtMemberNodes(data, definition, new Set([definition.id])),
  };
}

/**
 * Canonical tag completion surface for script editors.
 *
 * - `tags.*` contains every primitive/UDT tag and mirrors the runtime Proxy.
 * - UDT instances are also exposed as direct globals for backwards-compatible
 *   `Pump1.start()` / `Pump1.speed` syntax.
 */
export function createTagAutocompleteRoots(
  data: ProjectData | undefined
): AutocompleteApiNode[] {
  if (!data) return [];

  const tags = Object.values(data.tags).sort((left, right) =>
    left.name.localeCompare(right.name)
  );
  const namespace: AutocompleteApiNode = {
    label: "tags",
    completionType: "namespace",
    detail: "typed project tag proxy",
    children: [
      {
        label: "$get",
        completionType: "method",
        detail: "(path) → value",
      },
      {
        label: "$set",
        completionType: "method",
        detail: "(path, value) → void",
      },
      {
        label: "$children",
        completionType: "method",
        detail: "(path) → string[]",
      },
      ...tags.map((tag) => createTagNode(data, tag)),
    ],
  };

  const directUdtGlobals = tags
    .filter(isUdtTag)
    .map((tag) => createTagNode(data, tag));

  return [namespace, ...directUdtGlobals];
}

/** @deprecated use createTagAutocompleteRoots */
export const createUdtTagAutocompleteRoots = createTagAutocompleteRoots;

export function getTagNamespaceAutocompleteRoot(
  data: ProjectData | undefined
): AutocompleteApiNode | undefined {
  return createTagAutocompleteRoots(data).find((root) => root.label === "tags");
}

function createTagNode(
  data: ProjectData,
  tag: TagDefinition
): AutocompleteApiNode {
  if (isPrimitiveTag(tag)) {
    return {
      label: tag.name,
      completionType: "property",
      detail: `${tag.type.kind} tag · read/write`,
    };
  }

  const definition = data.udts[tag.type.udtId];
  return {
    label: tag.name,
    completionType: "class",
    detail: definition ? `${definition.name} tag` : "missing UDT",
    children: definition
      ? createUdtMemberNodes(data, definition, new Set([definition.id]))
      : [],
  };
}

function createUdtMemberNodes(
  data: ProjectData | undefined,
  definition: UdtDefinition,
  visited: Set<string>
): AutocompleteApiNode[] {
  return [
    ...definition.fields.map((field): AutocompleteApiNode => {
      if (field.type.kind !== "udt") {
        return {
          label: field.name,
          completionType: "property",
          detail: `${field.type.kind} · read/write`,
        };
      }

      const nestedDefinition = data?.udts[field.type.udtId];
      const circular = visited.has(field.type.udtId);
      return {
        label: field.name,
        completionType: "class",
        detail: `${nestedDefinition?.name ?? "UDT"} · nested tag`,
        children:
          nestedDefinition && !circular
            ? createUdtMemberNodes(
                data,
                nestedDefinition,
                new Set([...visited, nestedDefinition.id])
              )
            : [],
      };
    }),
    ...definition.methods.map((method) => ({
      label: method.name,
      completionType: "method",
      detail: "UDT method",
    })),
  ];
}
