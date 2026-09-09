import type { UiNode, UiVariant } from "./core/document";
import { getComponentDefinition } from "./registry/component-definitions";

const VARIANT_NAME_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const RESERVED_VARIANT_NAMES = new Set(["current", "reset"]);

export type ComponentVariantNameValidationResult =
  | { ok: true; name: string }
  | { ok: false; error: string };

export function getComponentVariantNames(node: UiNode): string[] {
  return Object.keys(node.variants ?? {}).sort((left, right) =>
    left.localeCompare(right)
  );
}

export function validateComponentVariantName(
  node: UiNode,
  value: string
): ComponentVariantNameValidationResult {
  const name = value.trim();

  if (!name) {
    return { ok: false, error: "Variant name is required." };
  }

  if (!VARIANT_NAME_PATTERN.test(name)) {
    return {
      ok: false,
      error: "Use a JS identifier, e.g. enabled, alarm or maintenanceMode.",
    };
  }

  if (RESERVED_VARIANT_NAMES.has(name)) {
    return {
      ok: false,
      error: `“${name}” is reserved by the variant API.`,
    };
  }

  if (node.variants?.[name]) {
    return {
      ok: false,
      error: `Variant “${name}” already exists.`,
    };
  }

  return { ok: true, name };
}

export function getComponentVariant(
  node: UiNode,
  variantName?: string
): UiVariant | undefined {
  if (!variantName) {
    return undefined;
  }

  return node.variants?.[variantName];
}

export function getComponentVariantProps(
  node: UiNode,
  variantName?: string
): Record<string, unknown> {
  return {
    ...(getComponentVariant(node, variantName)?.props ?? {}),
  };
}

export function getDefaultComponentVariantProps(
  node: UiNode
): Record<string, unknown> {
  return getComponentVariantProps(node, node.defaultVariant);
}

/**
 * New variants start as a complete visual snapshot of the component. Keeping
 * complete snapshots makes switching variants deterministic in the prototype:
 * a new variant cannot accidentally inherit a stale property from the previous
 * active variant.
 */
export function createComponentVariantSnapshot(
  node: UiNode,
  sourceVariantName: string | undefined = node.defaultVariant
): Record<string, unknown> {
  const definition = getComponentDefinition(node.type);

  return {
    ...(definition?.defaults ?? {}),
    ...(node.props ?? {}),
    ...getComponentVariantProps(node, sourceVariantName),
  };
}
