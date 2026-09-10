import {
  isJsIdentifier,
  type ComponentInputDefinition,
  type ComponentInputType,
  type UiComponentDefinition,
  type UiDocument,
  type UiNode,
} from "../core/document";
import { isReservedComponentApiName } from "../component-api-names";
import { getComponentDefinition } from "../registry/component-definitions";
import {
  getComponentDefinitionForInstance,
  getResolvedComponentInstanceProps,
} from "./instance-runtime";

export function createComponentInput(
  definition: UiComponentDefinition,
  internalNode: UiNode,
  property: string,
  requestedName: string,
  requestedType?: ComponentInputType,
  projectDocument?: UiDocument
): ComponentInputDefinition {
  const name = requestedName.trim();
  if (!isJsIdentifier(name)) {
    throw new Error("Use a JS identifier, e.g. color, tag or setpoint.");
  }
  if (definition.inputs?.[name]) {
    throw new Error(`Input “${name}” already exists.`);
  }
  if (definition.methods?.[name] || isReservedComponentApiName(name)) {
    throw new Error(`“${name}” conflicts with the component API.`);
  }

  const nestedDefinition = projectDocument
    ? getComponentDefinitionForInstance(projectDocument, internalNode)
    : undefined;

  if (internalNode.type === "ComponentInstance") {
    if (!nestedDefinition) {
      throw new Error(
        `Missing component definition for nested component “${internalNode.name}”.`
      );
    }

    const nestedInput = nestedDefinition.inputs?.[property];
    if (!nestedInput) {
      throw new Error(
        `Unknown public property “${property}” on ${internalNode.name}.`
      );
    }

    if (requestedType && requestedType !== nestedInput.type) {
      throw new Error(
        `“${internalNode.name}.${property}” is ${nestedInput.type}; the mapped public input must use the same type.`
      );
    }

    const resolvedProps = getResolvedComponentInstanceProps(
      nestedDefinition,
      internalNode
    );

    return {
      type: nestedInput.type,
      defaultValue: resolvedProps[property],
      target: {
        nodeId: internalNode.id,
        property,
        // Nested components receive public values through instance props. The
        // child contract owns the final mapping to a primitive prop/binding.
        kind: "prop",
      },
    };
  }

  const definitionForNode = getComponentDefinition(internalNode.type);
  const propertyNames = Array.from(
    new Set([
      ...Object.keys(definitionForNode?.defaults ?? {}),
      ...Object.keys(definitionForNode?.inspector ?? {}),
      ...Object.keys(internalNode.props ?? {}),
    ])
  );
  if (!propertyNames.includes(property)) {
    throw new Error(`Unknown property “${property}” on ${internalNode.name}.`);
  }

  const resolvedProps = {
    ...(definitionForNode?.defaults ?? {}),
    ...(internalNode.props ?? {}),
  };
  const inferredType =
    requestedType ?? inferInputType(property, resolvedProps[property]);
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

export function getComponentInputTargetType(
  document: UiDocument,
  internalNode: UiNode,
  property: string
): ComponentInputType | undefined {
  const nestedDefinition = getComponentDefinitionForInstance(document, internalNode);
  if (nestedDefinition) {
    return nestedDefinition.inputs?.[property]?.type;
  }

  const primitiveDefinition = getComponentDefinition(internalNode.type);
  const hasProperty = new Set([
    ...Object.keys(primitiveDefinition?.defaults ?? {}),
    ...Object.keys(primitiveDefinition?.inspector ?? {}),
    ...Object.keys(internalNode.props ?? {}),
  ]).has(property);

  if (!hasProperty) return undefined;

  const value =
    internalNode.props?.[property] ?? primitiveDefinition?.defaults?.[property];
  return inferInputType(property, value);
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
