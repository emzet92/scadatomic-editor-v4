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
        border-[var(--editor-border)]
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
            text-[var(--editor-text-muted)]
          "
        >
          Events
        </div>

        <div
          className="
            mt-1
            text-xs
            text-[var(--editor-text-soft)]
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