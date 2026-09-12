import type { Binding, ComponentInputDefinition } from "../../core/document";
import type { InspectorControl } from "../../registry/component-definitions";
import { PropInput } from "./PropInput";
import type { UpdateNode } from "./property-panel-types";

export function PropsEditor({
  nodeId,
  values,
  bindings,
  componentInputs,
  controls,
  updateNode,
}: {
  nodeId: string;
  values: Record<string, unknown>;
  bindings?: Record<string, Binding> | undefined;
  componentInputs?: Record<string, ComponentInputDefinition> | undefined;
  controls: Record<string, InspectorControl>;
  updateNode: UpdateNode;
}) {
  return (
    <div className="space-y-4">
      {Object.entries(controls).map(([key, control]) => (
        <PropInput
          key={key}
          nodeId={nodeId}
          propName={key}
          value={values[key]}
          values={values}
          bindings={bindings}
          componentInputs={componentInputs}
          control={control}
          updateNode={updateNode}
        />
      ))}
    </div>
  );
}
