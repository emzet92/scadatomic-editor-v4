import type {
  PropEntry,
  UpdateNode,
} from "./property-panel-types";
import { eventProps } from "./event-props";
import { EventCheckbox } from "./EventCheckbox";

export function EventsEditor({
  nodeId,
  props,
  updateNode,
}: {
  nodeId: string;
  props: PropEntry[];
  updateNode: UpdateNode;
}) {
  return (
    <div
      className="
        pt-4
        border-t
        border-zinc-200
        space-y-3
      "
    >
      <div>
        <div
          className="
            text-xs
            font-semibold
            uppercase
            tracking-wide
            text-zinc-500
          "
        >
          Events
        </div>

        <div
          className="
            mt-1
            text-xs
            text-zinc-400
          "
        >
          Enable runtime events emitted by this component.
        </div>
      </div>

      <div className="space-y-3">
        {props.map(([key, value]) => (
          <EventCheckbox
            key={key}
            nodeId={nodeId}
            propName={key}
            value={value}
            suffix={eventProps[key]}
            updateNode={updateNode}
          />
        ))}
      </div>
    </div>
  );
}
