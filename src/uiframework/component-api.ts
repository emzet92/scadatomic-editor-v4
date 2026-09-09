import type { UiNode } from "./core/document";
import { getComponentDefinition } from "./registry/component-definitions";

export type ComponentApiProperty = {
  name: string;
  valueType: string;
};

export type ComponentApiDescription = {
  nodeId: string;
  name: string;
  type: string;
  properties: ComponentApiProperty[];
  colorProperty?: string | undefined;
};

export function getComponentApiPropertyNames(node: UiNode): string[] {
  const definition = getComponentDefinition(node.type);
  const names = new Set<string>();

  for (const key of Object.keys(definition?.defaults ?? {})) {
    names.add(key);
  }

  for (const key of Object.keys(definition?.inspector ?? {})) {
    names.add(key);
  }

  for (const key of Object.keys(node.props ?? {})) {
    names.add(key);
  }

  return [...names].sort((left, right) => left.localeCompare(right));
}

export function getComponentColorProperty(node: UiNode): string | undefined {
  const names = new Set(getComponentApiPropertyNames(node));

  if (names.has("backgroundColor")) {
    return "backgroundColor";
  }

  if (names.has("color")) {
    return "color";
  }

  return undefined;
}

export function getResolvedComponentProps(node: UiNode): Record<string, unknown> {
  const definition = getComponentDefinition(node.type);

  return {
    ...(definition?.defaults ?? {}),
    ...(node.props ?? {}),
  };
}

export function describeComponentApi(node: UiNode): ComponentApiDescription {
  const resolved = getResolvedComponentProps(node);

  return {
    nodeId: node.id,
    name: node.name,
    type: node.type,
    properties: getComponentApiPropertyNames(node).map((name) => ({
      name,
      valueType: describeValueType(resolved[name]),
    })),
    colorProperty: getComponentColorProperty(node),
  };
}

function describeValueType(value: unknown): string {
  if (Array.isArray(value)) {
    return "array";
  }

  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "unknown";
  }

  return typeof value;
}
