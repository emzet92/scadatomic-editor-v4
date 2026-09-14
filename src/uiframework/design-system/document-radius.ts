import type { ComponentInputDefinition, UiDocument, UiNode } from "../core/document";
import {
  countRadiusTokenReferences,
  detachRadiusTokenReference,
  type RadiusTokenId,
} from "./radius";

export function detachRadiusTokenFromDocument(
  document: UiDocument,
  tokenId: RadiusTokenId,
  replacement: number
): UiDocument {
  return {
    ...document,
    nodes: mapNodes(document.nodes, tokenId, replacement),
    components: document.components
      ? Object.fromEntries(
          Object.entries(document.components).map(([id, definition]) => [
            id,
            {
              ...definition,
              nodes: mapNodes(definition.nodes, tokenId, replacement),
              inputs: definition.inputs
                ? mapInputs(definition.inputs, tokenId, replacement)
                : undefined,
            },
          ])
        )
      : document.components,
  };
}

export function countRadiusTokenUsages(
  document: UiDocument,
  tokenId: RadiusTokenId
): number {
  let count = countRadiusTokenReferences(document.nodes, tokenId);
  for (const definition of Object.values(document.components ?? {})) {
    count += countRadiusTokenReferences(definition.nodes, tokenId);
    count += countRadiusTokenReferences(definition.inputs, tokenId);
  }
  return count;
}

function mapNodes(
  nodes: Record<string, UiNode>,
  tokenId: RadiusTokenId,
  replacement: number
): Record<string, UiNode> {
  return Object.fromEntries(
    Object.entries(nodes).map(([id, node]) => [id, detachTokenFromNode(node, tokenId, replacement)])
  );
}

function detachTokenFromNode(
  node: UiNode,
  tokenId: RadiusTokenId,
  replacement: number
): UiNode {
  return {
    ...node,
    props: node.props
      ? (detachRadiusTokenReference(node.props, tokenId, replacement) as Record<string, unknown>)
      : node.props,
    variants: node.variants
      ? Object.fromEntries(
          Object.entries(node.variants).map(([name, variant]) => [
            name,
            {
              ...variant,
              props: detachRadiusTokenReference(
                variant.props,
                tokenId,
                replacement
              ) as Record<string, unknown>,
            },
          ])
        )
      : node.variants,
  };
}

function mapInputs(
  inputs: Record<string, ComponentInputDefinition>,
  tokenId: RadiusTokenId,
  replacement: number
): Record<string, ComponentInputDefinition> {
  return Object.fromEntries(
    Object.entries(inputs).map(([name, input]) => {
      if (input.type === "tagRef" || input.defaultValue === undefined) return [name, input];
      return [
        name,
        {
          ...input,
          defaultValue: detachRadiusTokenReference(input.defaultValue, tokenId, replacement),
        },
      ];
    })
  );
}
