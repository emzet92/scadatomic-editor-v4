import type { Binding, ComponentInputDefinition } from "../../core/document";
import type { InspectorControl } from "../../registry/component-definitions";
import type { UpdateNode } from "./property-panel-types";
import { PropertyControlRenderer } from "./property-control-registry";

export function PropInput({
  nodeId,
  propName,
  value,
  values,
  bindings,
  componentInputs,
  control,
  updateNode,
}: {
  nodeId: string;
  propName: string;
  value: unknown;
  values: Record<string, unknown>;
  bindings?: Record<string, Binding> | undefined;
  componentInputs?: Record<string, ComponentInputDefinition> | undefined;
  control: InspectorControl;
  updateNode: UpdateNode;
}) {
  function updateProp(nextValue: unknown) {
    updateNode(nodeId, (currentNode) => ({
      ...currentNode,
      props: {
        ...(currentNode.props ?? {}),
        [propName]: nextValue,
      },
    }));
  }

  return (
    <PropertyControlRenderer
      nodeId={nodeId}
      propName={propName}
      value={value}
      values={values}
      bindings={bindings}
      componentInputs={componentInputs}
      control={control}
      updateNode={updateNode}
      updateProp={updateProp}
    />
  );
}
