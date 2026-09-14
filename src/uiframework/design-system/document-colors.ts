import type { ComponentInputDefinition, UiDocument, UiNode } from "../core/document";
import {
  countColorTokenReferences,
  detachColorTokenReference,
  type ColorTokenId,
} from "./colors";

export function detachColorTokenFromDocument(
  document: UiDocument,
  tokenId: ColorTokenId,
  replacement: string
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

export function countColorTokenUsages(document: UiDocument, tokenId: ColorTokenId): number {
  let count = countColorTokenReferences(document.nodes, tokenId);
  for (const definition of Object.values(document.components ?? {})) {
    count += countColorTokenReferences(definition.nodes, tokenId);
    count += countColorTokenReferences(definition.inputs, tokenId);
  }
  return count;
}

function mapNodes(
  nodes: Record<string, UiNode>,
  tokenId: ColorTokenId,
  replacement: string
): Record<string, UiNode> {
  return Object.fromEntries(
    Object.entries(nodes).map(([id, node]) => [id, detachTokenFromNode(node, tokenId, replacement)])
  );
}

function detachTokenFromNode(node: UiNode, tokenId: ColorTokenId, replacement: string): UiNode {
  return {
    ...node,
    props: node.props
      ? (detachColorTokenReference(node.props, tokenId, replacement) as Record<string, unknown>)
      : node.props,
    variants: node.variants
      ? Object.fromEntries(
          Object.entries(node.variants).map(([name, variant]) => [
            name,
            {
              ...variant,
              props: detachColorTokenReference(
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
  tokenId: ColorTokenId,
  replacement: string
): Record<string, ComponentInputDefinition> {
  return Object.fromEntries(
    Object.entries(inputs).map(([name, input]) => {
      if (input.type === "tagRef" || input.defaultValue === undefined) {
        return [name, input];
      }
      return [
        name,
        {
          ...input,
          defaultValue: detachColorTokenReference(input.defaultValue, tokenId, replacement),
        },
      ];
    })
  );
}
