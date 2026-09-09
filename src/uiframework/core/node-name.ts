import type { NodeId, UiDocument } from "./document";

const NODE_NAME_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

export type NodeNameValidationResult =
  | { ok: true; name: string }
  | { ok: false; error: string };

export function validateNodeName(
  document: UiDocument,
  nodeId: NodeId,
  value: string
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

  const duplicate = Object.values(document.nodes).some(
    (node) => node.id !== nodeId && node.name === name
  );

  if (duplicate) {
    return { ok: false, error: `“${name}” is already used.` };
  }

  return { ok: true, name };
}

export function createUniqueNodeName(
  document: UiDocument,
  type: string
): string {
  const baseName = toIdentifier(type) || "Component";
  const usedNames = new Set(
    Object.values(document.nodes).map((node) => node.name)
  );

  let index = 1;
  let candidate = `${baseName}${index}`;

  while (usedNames.has(candidate)) {
    index += 1;
    candidate = `${baseName}${index}`;
  }

  return candidate;
}

function toIdentifier(value: string): string {
  const compact = value.replace(/[^A-Za-z0-9_$]/g, "");

  if (!compact) {
    return "";
  }

  return /^[A-Za-z_$]/.test(compact) ? compact : `Component${compact}`;
}
