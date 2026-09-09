import type { UiNode } from "./core/document";
import { getComponentVariantNames } from "./component-variants";
import { getComponentDefinition } from "./registry/component-definitions";

const METHOD_NAME_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const RESERVED_COMPONENT_API_NAMES = new Set([
  "id",
  "name",
  "type",
  "setProp",
  "setColor",
  "variant",
]);

export type ComponentApiProperty = {
  name: string;
  valueType: string;
};

export type ComponentApiMethod = {
  name: string;
  scriptId: string;
};

export type ComponentApiVariant = {
  name: string;
  isDefault: boolean;
};

export type ComponentApiDescription = {
  nodeId: string;
  name: string;
  type: string;
  properties: ComponentApiProperty[];
  methods: ComponentApiMethod[];
  variants: ComponentApiVariant[];
  colorProperty?: string | undefined;
};

export type ComponentMethodNameValidationResult =
  | { ok: true; name: string }
  | { ok: false; error: string };

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

export function getComponentApiMethodNames(node: UiNode): string[] {
  return Object.keys(node.methods ?? {}).sort((left, right) =>
    left.localeCompare(right)
  );
}

export function validateComponentMethodName(
  node: UiNode,
  value: string
): ComponentMethodNameValidationResult {
  const name = value.trim();

  if (!name) {
    return { ok: false, error: "Method name is required." };
  }

  if (!METHOD_NAME_PATTERN.test(name)) {
    return {
      ok: false,
      error: "Use a JS identifier, e.g. enable or setSpeed.",
    };
  }

  if (RESERVED_COMPONENT_API_NAMES.has(name)) {
    return {
      ok: false,
      error: `“${name}” is reserved by the component API.`,
    };
  }

  if (getComponentApiPropertyNames(node).includes(name)) {
    return {
      ok: false,
      error: `“${name}” conflicts with a component property.`,
    };
  }

  if (node.methods?.[name]) {
    return {
      ok: false,
      error: `Method “${name}” already exists.`,
    };
  }

  return { ok: true, name };
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
    methods: Object.entries(node.methods ?? {})
      .map(([name, method]) => ({
        name,
        scriptId: method.scriptId,
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    variants: getComponentVariantNames(node).map((name) => ({
      name,
      isDefault: node.defaultVariant === name,
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
