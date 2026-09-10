import type { UiComponentDefinition, UiDocument, UiNode } from "../core/document";
import { createProjectComponentRepository } from "../component-repository";

export function getComponentDefinitionForInstance(
  document: UiDocument,
  node: UiNode
): UiComponentDefinition | undefined {
  if (node.type !== "ComponentInstance" || !node.componentDefinitionId) {
    return undefined;
  }

  return createProjectComponentRepository(document).get(node.componentDefinitionId);
}

export function createComponentDefinitionDocument(
  document: UiDocument,
  definition: UiComponentDefinition
): UiDocument {
  return {
    schemaVersion: 4,
    rootId: definition.rootId,
    startPageId: "__component__",
    pages: {
      __component__: {
        id: "__component__",
        name: definition.name,
        rootId: definition.rootId,
      },
    },
    nodes: definition.nodes,
    components: document.components,
  };
}

export function getResolvedComponentInstanceProps(
  definition: UiComponentDefinition,
  instance: UiNode
): Record<string, unknown> {
  const defaults = Object.fromEntries(
    Object.entries(definition.inputs ?? {}).map(([name, input]) => [
      name,
      input.defaultValue,
    ])
  );

  return {
    ...defaults,
    ...(instance.props ?? {}),
  };
}

export function applyComponentInstanceInputs(
  document: UiDocument,
  definition: UiComponentDefinition,
  instance: UiNode
): UiDocument {
  const values = getResolvedComponentInstanceProps(definition, instance);
  const nodes = { ...definition.nodes };

  for (const [name, input] of Object.entries(definition.inputs ?? {})) {
    const value = values[name];
    if (value === undefined) continue;
    const targetNode = nodes[input.target.nodeId];
    if (!targetNode) continue;

    nodes[input.target.nodeId] =
      input.target.kind === "binding"
        ? {
            ...targetNode,
            bindings: {
              ...(targetNode.bindings ?? {}),
              [input.target.property]: {
                kind: "tag",
                path: String(value),
              },
            },
          }
        : {
            ...targetNode,
            props: {
              ...(targetNode.props ?? {}),
              [input.target.property]: value,
            },
          };
  }

  return createComponentDefinitionDocument(document, {
    ...definition,
    nodes,
  });
}
