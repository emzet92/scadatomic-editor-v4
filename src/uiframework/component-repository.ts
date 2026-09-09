import type {
  ComponentDefinitionId,
  UiComponentDefinition,
  UiDocument,
} from "./core/document";

export type ProjectComponentRepository = {
  list(): UiComponentDefinition[];
  get(id: ComponentDefinitionId): UiComponentDefinition | undefined;
  findByName(name: string): UiComponentDefinition | undefined;
  upsert(definition: UiComponentDefinition): UiDocument;
  remove(id: ComponentDefinitionId): UiDocument;
};

export function createProjectComponentRepository(
  document: UiDocument
): ProjectComponentRepository {
  const components = document.components ?? {};

  return {
    list() {
      return Object.values(components).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    },

    get(id) {
      return components[id];
    },

    findByName(name) {
      return Object.values(components).find(
        (component) => component.name === name
      );
    },

    upsert(definition) {
      return {
        ...document,
        components: {
          ...components,
          [definition.id]: definition,
        },
      };
    },

    remove(id) {
      const next = { ...components };
      delete next[id];

      return {
        ...document,
        components: Object.keys(next).length > 0 ? next : undefined,
      };
    },
  };
}

/**
 * User components may freely contain other project components, but component
 * definitions must remain acyclic so renderer/runtime recursion stays finite.
 */
export function wouldCreateComponentCycle(
  document: UiDocument,
  ownerComponentId: ComponentDefinitionId,
  childComponentId: ComponentDefinitionId
): boolean {
  if (ownerComponentId === childComponentId) return true;

  const visited = new Set<ComponentDefinitionId>();
  const stack: ComponentDefinitionId[] = [childComponentId];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId || visited.has(currentId)) continue;
    if (currentId === ownerComponentId) return true;

    visited.add(currentId);
    const definition = document.components?.[currentId];
    if (!definition) continue;

    for (const node of Object.values(definition.nodes)) {
      if (node.type === "ComponentInstance" && node.componentDefinitionId) {
        stack.push(node.componentDefinitionId);
      }
    }
  }

  return false;
}
