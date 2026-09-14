import type { ComponentInputDefinition, UiDocument, UiNode } from "../core/document";
import {
  countShadowTokenReferences,
  detachShadowTokenReference,
  type ShadowStyle,
  type ShadowTokenId,
} from "./shadows";

export function detachShadowTokenFromDocument(
  document: UiDocument,
  tokenId: ShadowTokenId,
  replacement: ShadowStyle
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

export function countShadowTokenUsages(document: UiDocument, tokenId: ShadowTokenId): number {
  let count = countShadowTokenReferences(document.nodes, tokenId);
  for (const definition of Object.values(document.components ?? {})) {
    count += countShadowTokenReferences(definition.nodes, tokenId);
    count += countShadowTokenReferences(definition.inputs, tokenId);
  }
  return count;
}

function mapNodes(
  nodes: Record<string, UiNode>,
  tokenId: ShadowTokenId,
  replacement: ShadowStyle
): Record<string, UiNode> {
  return Object.fromEntries(
    Object.entries(nodes).map(([id, node]) => [id, detachTokenFromNode(node, tokenId, replacement)])
  );
}

function detachTokenFromNode(
  node: UiNode,
  tokenId: ShadowTokenId,
  replacement: ShadowStyle
): UiNode {
  return {
    ...node,
    props: node.props
      ? (detachShadowTokenReference(node.props, tokenId, replacement) as Record<string, unknown>)
      : node.props,
    variants: node.variants
      ? Object.fromEntries(
          Object.entries(node.variants).map(([name, variant]) => [
            name,
            {
              ...variant,
              props: detachShadowTokenReference(
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
  tokenId: ShadowTokenId,
  replacement: ShadowStyle
): Record<string, ComponentInputDefinition> {
  return Object.fromEntries(
    Object.entries(inputs).map(([name, input]) => {
      if (input.type === "tagRef" || input.defaultValue === undefined) return [name, input];
      return [
        name,
        {
          ...input,
          defaultValue: detachShadowTokenReference(input.defaultValue, tokenId, replacement),
        },
      ];
    })
  );
}
