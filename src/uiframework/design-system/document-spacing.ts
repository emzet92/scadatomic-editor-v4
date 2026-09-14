import type { ComponentInputDefinition, UiDocument, UiNode } from "../core/document";
import {
  countSpacingTokenReferences,
  detachSpacingTokenReference,
  type SpacingTokenId,
} from "./spacing";

export function detachSpacingTokenFromDocument(
  document: UiDocument,
  tokenId: SpacingTokenId,
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

export function countSpacingTokenUsages(
  document: UiDocument,
  tokenId: SpacingTokenId
): number {
  let count = countSpacingTokenReferences(document.nodes, tokenId);
  for (const definition of Object.values(document.components ?? {})) {
    count += countSpacingTokenReferences(definition.nodes, tokenId);
    count += countSpacingTokenReferences(definition.inputs, tokenId);
  }
  return count;
}

function mapNodes(
  nodes: Record<string, UiNode>,
  tokenId: SpacingTokenId,
  replacement: number
): Record<string, UiNode> {
  return Object.fromEntries(
    Object.entries(nodes).map(([id, node]) => [id, detachTokenFromNode(node, tokenId, replacement)])
  );
}

function detachTokenFromNode(
  node: UiNode,
  tokenId: SpacingTokenId,
  replacement: number
): UiNode {
  return {
    ...node,
    props: node.props
      ? (detachSpacingTokenReference(node.props, tokenId, replacement) as Record<string, unknown>)
      : node.props,
    variants: node.variants
      ? Object.fromEntries(
          Object.entries(node.variants).map(([name, variant]) => [
            name,
            {
              ...variant,
              props: detachSpacingTokenReference(
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
  tokenId: SpacingTokenId,
  replacement: number
): Record<string, ComponentInputDefinition> {
  return Object.fromEntries(
    Object.entries(inputs).map(([name, input]) => {
      if (input.type === "tagRef" || input.defaultValue === undefined) return [name, input];
      return [
        name,
        {
          ...input,
          defaultValue: detachSpacingTokenReference(input.defaultValue, tokenId, replacement),
        },
      ];
    })
  );
}
