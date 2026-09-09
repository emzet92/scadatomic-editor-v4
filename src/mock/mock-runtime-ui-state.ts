import type { UiDocument } from "../uiframework/core/document";
import { getComponentVariantProps } from "../uiframework/component-variants";

type NodePropsOverrides = Record<string, Record<string, unknown>>;
type NodeVariantOverrides = Record<string, string>;

const PROPS_STORAGE_PREFIX = "scadatomic.mock.v1.runtime-ui.";
const VARIANT_STORAGE_PREFIX = "scadatomic.mock.v1.runtime-ui-variant.";

export function setMockRuntimeNodeProp(
  projectId: string,
  nodeId: string,
  property: string,
  value: unknown
): void {
  const overrides = readPropOverrides(projectId);
  const nodeOverrides = overrides[nodeId] ?? {};

  overrides[nodeId] = {
    ...nodeOverrides,
    [property]: value,
  };

  writePropOverrides(projectId, overrides);
}

export function getMockRuntimeNodeProps(
  projectId: string,
  nodeId: string
): Record<string, unknown> {
  return {
    ...(readPropOverrides(projectId)[nodeId] ?? {}),
  };
}

export function setMockRuntimeNodeVariant(
  projectId: string,
  nodeId: string,
  variantName: string
): void {
  const variants = readVariantOverrides(projectId);
  variants[nodeId] = variantName;
  writeVariantOverrides(projectId, variants);
}

export function getMockRuntimeNodeVariant(
  projectId: string,
  nodeId: string
): string | undefined {
  return readVariantOverrides(projectId)[nodeId];
}

export function applyMockRuntimeUiState(
  projectId: string,
  document: UiDocument
): UiDocument {
  const propOverrides = readPropOverrides(projectId);
  const variantOverrides = readVariantOverrides(projectId);
  let changed = false;
  const nodes = { ...document.nodes };

  for (const [nodeId, node] of Object.entries(document.nodes)) {
    const storedVariant = variantOverrides[nodeId];
    const variantName =
      storedVariant && node.variants?.[storedVariant]
        ? storedVariant
        : node.defaultVariant;
    const variantProps = getComponentVariantProps(node, variantName);
    const runtimeProps = propOverrides[nodeId] ?? {};

    if (
      Object.keys(variantProps).length === 0 &&
      Object.keys(runtimeProps).length === 0
    ) {
      continue;
    }

    const resolvedProps = {
      ...(node.props ?? {}),
      ...variantProps,
      ...runtimeProps,
    };

    // getSnapshot/setState consumers rely on referential stability. Reapplying
    // the same runtime/default-variant props must not manufacture a fresh
    // UiDocument on every pass.
    if (shallowRecordEqual(node.props ?? {}, resolvedProps)) {
      continue;
    }

    changed = true;
    nodes[nodeId] = {
      ...node,
      props: resolvedProps,
    };
  }

  return changed
    ? {
        ...document,
        nodes,
      }
    : document;
}

export function clearMockRuntimeUiState(projectId: string): void {
  sessionStorage.removeItem(propsStorageKey(projectId));
  sessionStorage.removeItem(variantStorageKey(projectId));
}

function readPropOverrides(projectId: string): NodePropsOverrides {
  const raw = sessionStorage.getItem(propsStorageKey(projectId));
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isNodePropsOverrides(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writePropOverrides(
  projectId: string,
  overrides: NodePropsOverrides
): void {
  sessionStorage.setItem(propsStorageKey(projectId), JSON.stringify(overrides));
}

function readVariantOverrides(projectId: string): NodeVariantOverrides {
  const raw = sessionStorage.getItem(variantStorageKey(projectId));
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isNodeVariantOverrides(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeVariantOverrides(
  projectId: string,
  variants: NodeVariantOverrides
): void {
  sessionStorage.setItem(variantStorageKey(projectId), JSON.stringify(variants));
}

function propsStorageKey(projectId: string): string {
  return `${PROPS_STORAGE_PREFIX}${projectId}`;
}

function variantStorageKey(projectId: string): string {
  return `${VARIANT_STORAGE_PREFIX}${projectId}`;
}

function isNodePropsOverrides(value: unknown): value is NodePropsOverrides {
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every(isRecord);
}

function isNodeVariantOverrides(value: unknown): value is NodeVariantOverrides {
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every((entry) => typeof entry === "string");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function shallowRecordEqual(
  left: Record<string, unknown>,
  right: Record<string, unknown>
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(right, key) &&
      Object.is(left[key], right[key])
  );
}
