import type { ComponentInputDefinition, UiDocument, UiNode } from "../core/document";
import {
  countTypographyTokenReferences,
  detachTypographyTokenReference,
  type TypographyStyle,
  type TypographyTokenId,
} from "./typography";

export function detachTypographyTokenFromDocument(
  document: UiDocument,
  tokenId: TypographyTokenId,
  replacement: TypographyStyle
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

export function countTypographyTokenUsages(
  document: UiDocument,
  tokenId: TypographyTokenId
): number {
  let count = countTypographyTokenReferences(document.nodes, tokenId);
  for (const definition of Object.values(document.components ?? {})) {
    count += countTypographyTokenReferences(definition.nodes, tokenId);
    count += countTypographyTokenReferences(definition.inputs, tokenId);
  }
  return count;
}

function mapNodes(
  nodes: Record<string, UiNode>,
  tokenId: TypographyTokenId,
  replacement: TypographyStyle
): Record<string, UiNode> {
  return Object.fromEntries(
    Object.entries(nodes).map(([id, node]) => [id, detachTokenFromNode(node, tokenId, replacement)])
  );
}

function detachTokenFromNode(
  node: UiNode,
  tokenId: TypographyTokenId,
  replacement: TypographyStyle
): UiNode {
  return {
    ...node,
    props: node.props
      ? (detachTypographyTokenReference(node.props, tokenId, replacement) as Record<string, unknown>)
      : node.props,
    variants: node.variants
      ? Object.fromEntries(
          Object.entries(node.variants).map(([name, variant]) => [
            name,
            {
              ...variant,
              props: detachTypographyTokenReference(
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
  tokenId: TypographyTokenId,
  replacement: TypographyStyle
): Record<string, ComponentInputDefinition> {
  return Object.fromEntries(
    Object.entries(inputs).map(([name, input]) => {
      if (input.type === "tagRef" || input.defaultValue === undefined) return [name, input];
      return [
        name,
        {
          ...input,
          defaultValue: detachTypographyTokenReference(input.defaultValue, tokenId, replacement),
        },
      ];
    })
  );
}
