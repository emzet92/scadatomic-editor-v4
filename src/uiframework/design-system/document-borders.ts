import type { ComponentInputDefinition, UiDocument, UiNode } from "../core/document";
import {
  countBorderTokenReferences,
  detachBorderTokenReference,
  type BorderStyle,
  type BorderTokenId,
} from "./borders";

export function detachBorderTokenFromDocument(
  document: UiDocument,
  tokenId: BorderTokenId,
  replacement: BorderStyle
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

export function countBorderTokenUsages(document: UiDocument, tokenId: BorderTokenId): number {
  let count = countBorderTokenReferences(document.nodes, tokenId);
  for (const definition of Object.values(document.components ?? {})) {
    count += countBorderTokenReferences(definition.nodes, tokenId);
    count += countBorderTokenReferences(definition.inputs, tokenId);
  }
  return count;
}

function mapNodes(
  nodes: Record<string, UiNode>,
  tokenId: BorderTokenId,
  replacement: BorderStyle
): Record<string, UiNode> {
  return Object.fromEntries(
    Object.entries(nodes).map(([id, node]) => [id, detachTokenFromNode(node, tokenId, replacement)])
  );
}

function detachTokenFromNode(
  node: UiNode,
  tokenId: BorderTokenId,
  replacement: BorderStyle
): UiNode {
  return {
    ...node,
    props: node.props
      ? (detachBorderTokenReference(node.props, tokenId, replacement) as Record<string, unknown>)
      : node.props,
    variants: node.variants
      ? Object.fromEntries(
          Object.entries(node.variants).map(([name, variant]) => [
            name,
            {
              ...variant,
              props: detachBorderTokenReference(
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
  tokenId: BorderTokenId,
  replacement: BorderStyle
): Record<string, ComponentInputDefinition> {
  return Object.fromEntries(
    Object.entries(inputs).map(([name, input]) => {
      if (input.type === "tagRef" || input.defaultValue === undefined) return [name, input];
      return [
        name,
        {
          ...input,
          defaultValue: detachBorderTokenReference(input.defaultValue, tokenId, replacement),
        },
      ];
    })
  );
}
