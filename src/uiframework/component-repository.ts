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
