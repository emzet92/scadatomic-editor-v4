import {
  isJsIdentifier,
  type UiComponentDefinition,
  type UiDocument,
  type UiNode,
} from "./core/document";
import { getComponentVariantNames } from "./component-variants";
import { isReservedComponentApiName } from "./component-api-names";
import { getComponentDefinition } from "./registry/component-definitions";
import {
  getComponentDefinitionForInstance,
  getResolvedComponentInstanceProps,
} from "./reusable-components";

export type ComponentApiProperty = {
  name: string;
  valueType: string;
  members?: ComponentApiProperty[] | undefined;
  methods?: { name: string }[] | undefined;
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
  /** Reusable components expose only their explicitly declared public contract. */
  apiSurface: "primitive" | "reusable";
  definitionName?: string | undefined;
  properties: ComponentApiProperty[];
  methods: ComponentApiMethod[];
  variants: ComponentApiVariant[];
  colorProperty?: string | undefined;
};

export type ComponentMethodNameValidationResult =
  | { ok: true; name: string }
  | { ok: false; error: string };

export function getComponentApiPropertyNames(
  node: UiNode,
  document?: UiDocument
): string[] {
  const reusable = document
    ? getComponentDefinitionForInstance(document, node)
    : undefined;

  if (reusable) {
    return Object.keys(reusable.inputs ?? {}).sort((left, right) =>
      left.localeCompare(right)
    );
  }

  // A reusable instance never falls back to its storage props. Its external
  // contract is definition-driven; a missing definition therefore exposes
  // nothing instead of leaking instance/framework implementation details.
  if (node.type === "ComponentInstance" || node.componentDefinitionId) {
    return [];
  }

  const definition = getComponentDefinition(node.type);
  const names = new Set<string>();

  for (const key of Object.keys(definition?.defaults ?? {})) names.add(key);
  for (const key of Object.keys(definition?.inspector ?? {})) names.add(key);
  for (const key of Object.keys(node.props ?? {})) names.add(key);

  return [...names].sort((left, right) => left.localeCompare(right));
}

export function getComponentApiMethodNames(
  node: UiNode,
  document?: UiDocument,
  includePrivate = false
): string[] {
  const reusable = document
    ? getComponentDefinitionForInstance(document, node)
    : undefined;

  if (reusable) {
    return Object.entries(reusable.methods ?? {})
      .filter(([, method]) => includePrivate || method.visibility === "public")
      .map(([name]) => name)
      .sort((left, right) => left.localeCompare(right));
  }

  if (node.type === "ComponentInstance" || node.componentDefinitionId) {
    return [];
  }

  return Object.keys(node.methods ?? {}).sort((left, right) =>
    left.localeCompare(right)
  );
}

export function validateComponentMethodName(
  node: UiNode,
  value: string
): ComponentMethodNameValidationResult {
  const name = value.trim();

  if (!name) return { ok: false, error: "Method name is required." };

  if (!isJsIdentifier(name)) {
    return {
      ok: false,
      error: "Use a JS identifier, e.g. enable or setSpeed.",
    };
  }

  if (isReservedComponentApiName(name)) {
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
    return { ok: false, error: `Method “${name}” already exists.` };
  }

  return { ok: true, name };
}

export function validateDefinitionMethodName(
  definition: UiComponentDefinition,
  value: string
): ComponentMethodNameValidationResult {
  const name = value.trim();
  if (!name) return { ok: false, error: "Method name is required." };
  if (!isJsIdentifier(name)) {
    return {
      ok: false,
      error: "Use a JS identifier, e.g. start, reset or syncStatus.",
    };
  }
  if (isReservedComponentApiName(name) || definition.inputs?.[name]) {
    return {
      ok: false,
      error: `“${name}” conflicts with the component public API.`,
    };
  }
  if (definition.methods?.[name]) {
    return { ok: false, error: `Method “${name}” already exists.` };
  }
  return { ok: true, name };
}

export function getComponentColorProperty(
  node: UiNode,
  document?: UiDocument
): string | undefined {
  const reusable = document
    ? getComponentDefinitionForInstance(document, node)
    : undefined;

  if (reusable) {
    return Object.entries(reusable.inputs ?? {}).find(
      ([, input]) => input.type === "color"
    )?.[0];
  }

  const names = new Set(getComponentApiPropertyNames(node));
  if (names.has("backgroundColor")) return "backgroundColor";
  if (names.has("color")) return "color";
  return undefined;
}

export function getResolvedComponentProps(
  node: UiNode,
  document?: UiDocument
): Record<string, unknown> {
  const reusable = document
    ? getComponentDefinitionForInstance(document, node)
    : undefined;

  if (reusable) {
    return getResolvedComponentInstanceProps(reusable, node);
  }

  if (node.type === "ComponentInstance" || node.componentDefinitionId) {
    return {};
  }

  const definition = getComponentDefinition(node.type);
  return {
    ...(definition?.defaults ?? {}),
    ...(node.props ?? {}),
  };
}

export function describeComponentApi(
  node: UiNode,
  document?: UiDocument
): ComponentApiDescription {
  const reusable = document
    ? getComponentDefinitionForInstance(document, node)
    : undefined;
  const resolved = getResolvedComponentProps(node, document);

  const methods = reusable
    ? Object.entries(reusable.methods ?? {})
        .filter(([, method]) => method.visibility === "public")
        .map(([name, method]) => ({ name, scriptId: method.scriptId }))
        .sort((left, right) => left.name.localeCompare(right.name))
    : node.type === "ComponentInstance" || node.componentDefinitionId
      ? []
      : Object.entries(node.methods ?? {})
          .map(([name, method]) => ({ name, scriptId: method.scriptId }))
          .sort((left, right) => left.name.localeCompare(right.name));

  const variantSource = reusable?.nodes[reusable.rootId] ??
    (node.type === "ComponentInstance" || node.componentDefinitionId ? undefined : node);

  return {
    nodeId: node.id,
    name: node.name,
    type: reusable ? "Component" : node.type,
    apiSurface: reusable || node.type === "ComponentInstance" || node.componentDefinitionId
      ? "reusable"
      : "primitive",
    definitionName: reusable?.name,
    properties: getComponentApiPropertyNames(node, document).map((name) => ({
      name,
      valueType: reusable?.inputs?.[name]?.type ?? describeValueType(resolved[name]),
    })),
    methods,
    // A reusable component exposes the variants defined on its private root.
    // This keeps the generated ctx.ui.<instance>.variant API aligned with the
    // visual definition without copying variants onto every instance.
    variants: variantSource
      ? getComponentVariantNames(variantSource).map((name) => ({
          name,
          isDefault: variantSource.defaultVariant === name,
        }))
      : [],
    colorProperty: getComponentColorProperty(node, document),
  };
}

function describeValueType(value: unknown): string {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  if (value === undefined) return "unknown";
  return typeof value;
}
