import type { NodeId, UiDocument } from "./document";

const NODE_NAME_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const RESERVED_UI_API_NAMES = new Set(["get", "setProp", "setColor"]);

export type NodeNameValidationResult =
  | { ok: true; name: string }
  | { ok: false; error: string };

export function validateNodeName(
  document: UiDocument,
  nodeId: NodeId,
  value: string,
  rootId: NodeId = document.rootId
): NodeNameValidationResult {
  const name = value.trim();

  if (!name) {
    return { ok: false, error: "Name is required." };
  }

  if (!NODE_NAME_PATTERN.test(name)) {
    return {
      ok: false,
      error: "Use a JS identifier, e.g. MainPump or start_button.",
    };
  }

  if (RESERVED_UI_API_NAMES.has(name)) {
    return {
      ok: false,
      error: `“${name}” is reserved by ctx.ui.`,
    };
  }

  const scopedNodeIds = collectSubtreeIds(document, rootId);
  const duplicate = scopedNodeIds.some((id) => {
    const node = document.nodes[id];
    return node?.id !== nodeId && node?.name === name;
  });

  if (duplicate) {
    return { ok: false, error: `“${name}” is already used on this page.` };
  }

  return { ok: true, name };
}

export function createUniqueNodeName(
  document: UiDocument,
  type: string,
  rootId: NodeId = document.rootId
): string {
  const baseName = toIdentifier(type) || "Component";
  const usedNames = new Set(
    collectSubtreeIds(document, rootId)
      .map((id) => document.nodes[id]?.name)
      .filter((name): name is string => !!name)
  );

  let index = 1;
  let candidate = `${baseName}${index}`;

  while (usedNames.has(candidate)) {
    index += 1;
    candidate = `${baseName}${index}`;
  }

  return candidate;
}

function collectSubtreeIds(document: UiDocument, rootId: NodeId) {
  const result: NodeId[] = [];
  const stack = [rootId];
  const visited = new Set<NodeId>();

  while (stack.length > 0) {
    const nodeId = stack.pop();
    if (!nodeId || visited.has(nodeId)) continue;
    visited.add(nodeId);

    const node = document.nodes[nodeId];
    if (!node) continue;
    result.push(nodeId);
    stack.push(...(node.children ?? []));
  }

  return result;
}

function toIdentifier(value: string): string {
  const compact = value.replace(/[^A-Za-z0-9_$]/g, "");

  if (!compact) {
    return "";
  }

  return /^[A-Za-z_$]/.test(compact) ? compact : `Component${compact}`;
}
