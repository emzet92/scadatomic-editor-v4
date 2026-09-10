import {
  describeComponentApi,
  type ComponentApiDescription,
} from "./component-api";
import type {
  UiComponentDefinition,
  UiDocument,
} from "./core/document";

/**
 * Script-facing API for code owned by a reusable component definition.
 *
 * self     -> current component instance contract + private methods
 * internal -> private nodes physically owned by the definition
 * ctx.ui   -> intentionally NOT built here; it stays the scene-public facade
 */
export function describeComponentScriptSelfApi(
  definition: UiComponentDefinition
): ComponentApiDescription {
  const root = definition.nodes[definition.rootId];
  const variantNames = Object.keys(root?.variants ?? {}).sort((left, right) =>
    left.localeCompare(right)
  );

  return {
    nodeId: `definition:${definition.id}`,
    name: "self",
    type: definition.name,
    apiSurface: "reusable",
    definitionName: definition.name,
    properties: Object.entries(definition.inputs ?? {}).map(([name, input]) => ({
      name,
      valueType: input.type,
    })),
    // Component-owned scripts can call both public and private methods through
    // self. Visibility only controls the facade exposed outside the definition.
    methods: Object.entries(definition.methods ?? {})
      .map(([name, method]) => ({ name, scriptId: method.scriptId }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    variants: variantNames.map((name) => ({
      name,
      isDefault: root?.defaultVariant === name,
    })),
    colorProperty: Object.entries(definition.inputs ?? {}).find(
      ([, input]) => input.type === "color"
    )?.[0],
  };
}

export function describeComponentScriptInternalApi(
  document: UiDocument,
  definition: UiComponentDefinition
): ComponentApiDescription[] {
  const byName = new Map<string, ComponentApiDescription>();

  for (const node of Object.values(definition.nodes)) {
    // Primitive nodes expose their normal API. A nested user component goes
    // through describeComponentApi(), which exposes only that child's public
    // inputs/methods/variants; its private implementation never leaks upward.
    byName.set(node.name, describeComponentApi(node, document));
  }

  return [...byName.values()].sort((left, right) =>
    left.name.localeCompare(right.name)
  );
}
