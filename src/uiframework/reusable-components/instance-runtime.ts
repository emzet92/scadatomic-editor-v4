import type { BindingExpression, ReactivePropertyBinding, ReactiveRef } from "../../reactivity";
import type { Binding, UiComponentDefinition, UiDocument, UiNode } from "../core/document";
import { createProjectComponentRepository } from "../component-repository";
import { isTagRef, resolveTagRef, type TagRef } from "../data/collections/TagRef";
import { resolveTagFieldRef } from "../data/tags/TagFieldRef";
import type { ProjectData } from "../data/tags/TagDefinition";

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
    data: document.data,
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
  const nodes = structuredClone(definition.nodes);

  for (const [name, input] of Object.entries(definition.inputs ?? {})) {
    const value = values[name];

    if (input.type === "tagRef") {
      if (!isTagRef(value)) continue;
      const tag = resolveTagRef(document.data, value);
      if (!tag) continue;
      resolveRelativeTagBindings(nodes, name, tag.name, value, document.data);
      continue;
    }

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

function resolveRelativeTagBindings(
  nodes: Record<string, UiNode>,
  inputName: string,
  tagName: string,
  tagRef: TagRef,
  projectData: ProjectData | undefined,
) {
  for (const [nodeId, node] of Object.entries(nodes)) {
    if (!node.bindings) continue;
    let changed = false;
    const bindings: Record<string, Binding> = { ...node.bindings };

    for (const [property, binding] of Object.entries(bindings)) {
      if (binding.kind === "tagRef" && binding.input === inputName) {
        bindings[property] = {
          kind: "tag",
          path: binding.path ? `${tagName}.${binding.path}` : tagName,
        };
        changed = true;
        continue;
      }

      if (binding.kind === "reactive") {
        const resolved = resolveComponentTagBinding(
          binding,
          inputName,
          tagRef,
          projectData,
        );
        if (resolved !== binding) {
          bindings[property] = resolved;
          changed = true;
        }
      }
    }

    if (changed) nodes[nodeId] = { ...node, bindings };
  }
}


function resolveComponentTagBinding(
  binding: ReactivePropertyBinding,
  inputName: string,
  tagRef: TagRef,
  projectData: ProjectData | undefined,
): ReactivePropertyBinding {
  let changed = false;
  const mapRef = (ref: ReactiveRef): ReactiveRef => {
    if (ref.kind !== "component-tag" || ref.input !== inputName) return ref;
    changed = true;
    const absolute = { tagId: tagRef.tagId, fieldIds: [...ref.fieldIds] };
    const resolved = projectData ? resolveTagFieldRef(projectData, absolute) : undefined;
    return {
      kind: "tag",
      ref: absolute,
      path: resolved?.path ?? ref.path,
    };
  };

  const dependencies = binding.dependencies.map(mapRef);
  const expression = mapExpressionRefs(binding.expression, mapRef);
  return changed ? { ...binding, dependencies, expression } : binding;
}

function mapExpressionRefs(
  expression: BindingExpression,
  mapRef: (ref: ReactiveRef) => ReactiveRef,
): BindingExpression {
  switch (expression.type) {
    case "constant":
      return expression;
    case "ref":
      return { ...expression, ref: mapRef(expression.ref) };
    case "not":
      return { ...expression, operand: mapExpressionRefs(expression.operand, mapRef) };
    case "equals":
      return {
        ...expression,
        left: mapExpressionRefs(expression.left, mapRef),
        right: mapExpressionRefs(expression.right, mapRef),
      };
    case "not-equals":
      return {
        ...expression,
        left: mapExpressionRefs(expression.left, mapRef),
        right: mapExpressionRefs(expression.right, mapRef),
      };
    case "greater-than":
      return {
        ...expression,
        left: mapExpressionRefs(expression.left, mapRef),
        right: mapExpressionRefs(expression.right, mapRef),
      };
    case "less-than":
      return {
        ...expression,
        left: mapExpressionRefs(expression.left, mapRef),
        right: mapExpressionRefs(expression.right, mapRef),
      };
    case "and":
      return { ...expression, operands: expression.operands.map((item) => mapExpressionRefs(item, mapRef)) };
    case "or":
      return { ...expression, operands: expression.operands.map((item) => mapExpressionRefs(item, mapRef)) };
    case "conditional":
      return {
        ...expression,
        condition: mapExpressionRefs(expression.condition, mapRef),
        whenTrue: mapExpressionRefs(expression.whenTrue, mapRef),
        whenFalse: mapExpressionRefs(expression.whenFalse, mapRef),
      };
    case "format":
      return { ...expression, value: mapExpressionRefs(expression.value, mapRef) };
  }
}
