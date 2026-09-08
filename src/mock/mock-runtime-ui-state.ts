import type { UiDocument } from "../uiframework/core/document";

type NodePropsOverrides = Record<string, Record<string, unknown>>;

const STORAGE_PREFIX = "scadatomic.mock.v1.runtime-ui.";

export function setMockRuntimeNodeProp(
  projectId: string,
  nodeId: string,
  property: string,
  value: unknown
): void {
  const overrides = readOverrides(projectId);
  const nodeOverrides = overrides[nodeId] ?? {};

  overrides[nodeId] = {
    ...nodeOverrides,
    [property]: value,
  };

  writeOverrides(projectId, overrides);
}

export function applyMockRuntimeUiState(
  projectId: string,
  document: UiDocument
): UiDocument {
  const overrides = readOverrides(projectId);
  let changed = false;
  const nodes = { ...document.nodes };

  for (const [nodeId, props] of Object.entries(overrides)) {
    const node = nodes[nodeId];
    if (!node) {
      continue;
    }

    changed = true;
    nodes[nodeId] = {
      ...node,
      props: {
        ...(node.props ?? {}),
        ...props,
      },
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
  sessionStorage.removeItem(storageKey(projectId));
}

function readOverrides(projectId: string): NodePropsOverrides {
  const raw = sessionStorage.getItem(storageKey(projectId));
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

function writeOverrides(projectId: string, overrides: NodePropsOverrides): void {
  sessionStorage.setItem(storageKey(projectId), JSON.stringify(overrides));
}

function storageKey(projectId: string): string {
  return `${STORAGE_PREFIX}${projectId}`;
}

function isNodePropsOverrides(value: unknown): value is NodePropsOverrides {
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every(isRecord);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
