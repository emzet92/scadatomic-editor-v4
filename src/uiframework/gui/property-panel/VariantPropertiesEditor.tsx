import { getComponentVariantProps } from "../../component-variants";
import type { UiNode } from "../../core/document";
import { getComponentDefinition } from "../../registry/component-definitions";
import { PropsEditor } from "./PropsEditor";
import type { UpdateNode } from "./property-panel-types";
import { VariantsEditor } from "./VariantsEditor";

export function VariantPropertiesEditor({
  node,
  variantName,
  updateNode,
  onEditVariant,
}: {
  node: UiNode;
  variantName: string;
  updateNode: UpdateNode;
  onEditVariant: (nodeId: string, variantName: string) => void;
}) {
  const variant = node.variants?.[variantName];
  const definition = getComponentDefinition(node.type);

  if (!variant) {
    return (
      <div className="text-xs text-amber-700">
        Variant “{variantName}” no longer exists.
      </div>
    );
  }

  const variantValues = {
    ...(definition?.defaults ?? {}),
    ...getComponentVariantProps(node, variantName),
  };

  const updateVariantNode: UpdateNode = (nodeId, updater) => {
    updateNode(nodeId, (currentNode) => {
      const currentVariant = currentNode.variants?.[variantName];
      if (!currentVariant) return currentNode;

      const syntheticNode: UiNode = {
        ...currentNode,
        props: { ...currentVariant.props },
        defaultVariant: undefined,
      };
      const updated = updater(syntheticNode);

      return {
        ...currentNode,
        variants: {
          ...(currentNode.variants ?? {}),
          [variantName]: {
            props: { ...(updated.props ?? {}) },
          },
        },
      };
    });
  };

  return (
    <>
      {definition ? (
        <PropsEditor
          nodeId={node.id}
          values={variantValues}
          controls={definition.inspector}
          updateNode={updateVariantNode}
        />
      ) : (
        <div className="text-xs text-amber-700">
          No component definition for {node.type}.
        </div>
      )}

      <VariantsEditor
        node={node}
        updateNode={updateNode}
        onEditVariant={onEditVariant}
      />
    </>
  );
}
