import {
  isJsIdentifier,
  type ComponentInputDefinition,
  type ComponentInputType,
  type NodeId,
  type UiComponentDefinition,
  type UiDocument,
  type UiNode,
} from "./core/document";
import { getComponentDefinition } from "./registry/component-definitions";

export type CreateReusableComponentResult = {
  document: UiDocument;
  componentId: string;
  instanceNodeId: string;
};

export function createReusableComponentFromNode(
  document: UiDocument,
  nodeId: string
): CreateReusableComponentResult {
  const sourceRoot = document.nodes[nodeId];
  if (!sourceRoot) {
    throw new Error("Node not found.");
  }

  if (nodeId === document.rootId) {
    throw new Error("The root node cannot be converted into a reusable component.");
  }

  if (sourceRoot.type === "ComponentInstance") {
    throw new Error("This node is already a reusable component instance.");
  }

  const subtreeIds = collectSubtree(document, nodeId);
  const idMap = new Map<string, string>();
  for (const id of subtreeIds) {
    idMap.set(id, crypto.randomUUID());
  }

  const componentNodes: Record<string, UiNode> = {};
  for (const oldId of subtreeIds) {
    const node = document.nodes[oldId];
    const newId = idMap.get(oldId);
    if (!node || !newId) continue;

    componentNodes[newId] = {
      ...structuredClone(node),
      id: newId,
      children: node.children
        ?.filter((childId) => idMap.has(childId))
        .map((childId) => idMap.get(childId) as string),
    };
  }

  const componentId = crypto.randomUUID();
  const componentName = createUniqueComponentName(
    document,
    `${toIdentifier(sourceRoot.name)}Component`
  );
  const componentRootId = idMap.get(nodeId);
  if (!componentRootId) {
    throw new Error("Failed to create component root.");
  }

  const definition: UiComponentDefinition = {
    id: componentId,
    name: componentName,
    rootId: componentRootId,
    nodes: componentNodes,
  };

  const nextNodes = { ...document.nodes };
  for (const id of subtreeIds) {
    if (id !== nodeId) {
      delete nextNodes[id];
    }
  }

  nextNodes[nodeId] = {
    id: sourceRoot.id,
    name: sourceRoot.name,
    type: "ComponentInstance",
    componentDefinitionId: componentId,
    props: {},
  };

  return {
    componentId,
    instanceNodeId: nodeId,
    document: {
      ...document,
      nodes: nextNodes,
      components: {
        ...(document.components ?? {}),
        [componentId]: definition,
      },
    },
  };
}

export function getComponentDefinitionForInstance(
  document: UiDocument,
  node: UiNode
): UiComponentDefinition | undefined {
  if (node.type !== "ComponentInstance" || !node.componentDefinitionId) {
    return undefined;
  }

  return document.components?.[node.componentDefinitionId];
}

export function createComponentDefinitionDocument(
  document: UiDocument,
  definition: UiComponentDefinition
): UiDocument {
  return {
    schemaVersion: 2,
    rootId: definition.rootId,
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

  return {
    schemaVersion: 2,
    rootId: definition.rootId,
    nodes,
    components: document.components,
  };
}

export function createComponentInput(
  definition: UiComponentDefinition,
  internalNode: UiNode,
  property: string,
  requestedName: string,
  requestedType?: ComponentInputType
): ComponentInputDefinition {
  const name = requestedName.trim();
  if (!isJsIdentifier(name)) {
    throw new Error("Use a JS identifier, e.g. color, tag or setpoint.");
  }
  if (definition.inputs?.[name]) {
    throw new Error(`Input “${name}” already exists.`);
  }
  if (definition.methods?.[name] || ["id", "name", "type", "setProp", "setColor", "variant"].includes(name)) {
    throw new Error(`“${name}” conflicts with the component API.`);
  }

  const definitionForNode = getComponentDefinition(internalNode.type);
  const propertyNames = Array.from(new Set([
    ...Object.keys(definitionForNode?.defaults ?? {}),
    ...Object.keys(definitionForNode?.inspector ?? {}),
    ...Object.keys(internalNode.props ?? {}),
  ]));
  if (!propertyNames.includes(property)) {
    throw new Error(`Unknown property “${property}” on ${internalNode.name}.`);
  }

  const resolvedProps = {
    ...(definitionForNode?.defaults ?? {}),
    ...(internalNode.props ?? {}),
  };
  const inferredType = requestedType ?? inferInputType(property, resolvedProps[property]);
  const defaultValue =
    inferredType === "tag"
      ? internalNode.bindings?.[property]?.path ?? ""
      : resolvedProps[property];

  return {
    type: inferredType,
    defaultValue,
    target: {
      nodeId: internalNode.id,
      property,
      kind: inferredType === "tag" ? "binding" : "prop",
    },
  };
}

export function inferInputType(
  property: string,
  value: unknown
): ComponentInputType {
  if (/color/i.test(property)) return "color";
  if (/tag/i.test(property)) return "tag";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  return "string";
}

export function createUniqueComponentName(
  document: UiDocument,
  preferred: string
): string {
  const base = toIdentifier(preferred) || "Component";
  const used = new Set(
    Object.values(document.components ?? {}).map((component) => component.name)
  );

  if (!used.has(base)) return base;

  let index = 2;
  while (used.has(`${base}${index}`)) index += 1;
  return `${base}${index}`;
}

export function collectSubtree(document: UiDocument, nodeId: string): string[] {
  const result: string[] = [];
  const stack = [nodeId];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId || result.includes(currentId)) continue;
    const node = document.nodes[currentId];
    if (!node) continue;
    result.push(currentId);
    for (const childId of node.children ?? []) stack.push(childId);
  }

  return result;
}

function toIdentifier(value: string) {
  const cleaned = value
    .trim()
    .replace(/[^A-Za-z0-9_$]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part, index) =>
      index === 0
        ? part.replace(/^[0-9]+/, "")
        : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join("");

  return isJsIdentifier(cleaned) ? cleaned : "Component";
}
