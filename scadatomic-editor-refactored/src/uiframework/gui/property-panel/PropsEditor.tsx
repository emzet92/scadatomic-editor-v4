import type { InspectorControl } from "../../registry/component-definitions";
import { PropInput } from "./PropInput";
import type { UpdateNode } from "./property-panel-types";

export function PropsEditor({
  nodeId,
  values,
  controls,
  updateNode,
}: {
  nodeId: string;
  values: Record<string, unknown>;
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
          control={control}
          updateNode={updateNode}
        />
      ))}
    </div>
  );
}
