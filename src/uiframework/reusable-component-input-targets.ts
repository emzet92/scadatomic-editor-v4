import { getComponentApiPropertyNames } from "./component-api";
import type { UiComponentDefinition, UiDocument, UiNode } from "./core/document";

export type ComponentInputTargetOption = {
  node: UiNode;
  properties: string[];
};

/**
 * Lists every internal node that can participate in the public input contract.
 * Root-tree order is kept for predictable UX; detached implementation nodes are
 * appended so a temporarily detached node does not silently become unmappable.
 */
export function listComponentInputTargets(
  definition: UiComponentDefinition,
  projectDocument: UiDocument
): ComponentInputTargetOption[] {
  const result: ComponentInputTargetOption[] = [];
  const visited = new Set<string>();

  function appendNode(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = definition.nodes[nodeId];
    if (!node) return;

    const properties = getComponentApiPropertyNames(node, projectDocument);
    if (properties.length > 0) result.push({ node, properties });

    for (const childId of node.children ?? []) appendNode(childId);
  }

  appendNode(definition.rootId);
  for (const node of Object.values(definition.nodes)) appendNode(node.id);

  return result;
}

export function selectComponentInputTarget(
  targets: readonly ComponentInputTargetOption[],
  nodeId: string,
  preferredProperty?: string
): { target: ComponentInputTargetOption; property: string } | undefined {
  const target = targets.find((entry) => entry.node.id === nodeId);
  if (!target) return undefined;

  const property =
    preferredProperty && target.properties.includes(preferredProperty)
      ? preferredProperty
      : target.properties[0];

  return property ? { target, property } : undefined;
}
