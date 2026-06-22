import type {
  PropEntry,
  UpdateNode,
} from "./property-panel-types";
import { PropInput } from "./PropInput";

export function PropsEditor({
  nodeId,
  props,
  updateNode,
}: {
  nodeId: string;
  props: PropEntry[];
  updateNode: UpdateNode;
}) {
  return (
    <div className="space-y-4">
      {props.map(([key, value]) => (
        <PropInput
          key={key}
          nodeId={nodeId}
          propName={key}
          value={value}
          updateNode={updateNode}
        />
      ))}
    </div>
  );
}
