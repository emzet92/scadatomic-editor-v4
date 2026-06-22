import { Link } from "react-router-dom";
import type { UpdateNode } from "./property-panel-types";

export function EventCheckbox({
  nodeId,
  propName,
  value,
  suffix,
  updateNode,
}: {
  nodeId: string;
  propName: string;
  value: unknown;
  suffix: string;
  updateNode: UpdateNode;
}) {
  const checked = Boolean(value);
  const generatedEventName = `${nodeId}.${suffix}`;

  const eventName = checked
    ? String(value)
    : generatedEventName;

  return (
    <div
      className="
        flex
        items-center
        gap-3
        rounded-lg
        border
        border-zinc-200
        bg-white
        px-3
        py-3
        hover:bg-zinc-50
      "
    >
      <input
        data-editor-ignore
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          const checked = e.target.checked;

          updateNode(nodeId, (currentNode) => {
            const nextProps: Record<string, unknown> = {
              ...(currentNode.props ?? {}),
            };

            if (checked) {
              nextProps[propName] = generatedEventName;
            } else {
              nextProps[propName] = "";
            }

            return {
              ...currentNode,
              props: nextProps,
            };
          });
        }}
        className="
          h-4
          w-4
          rounded
          border-zinc-300
          text-sky-600
          focus:ring-sky-500
        "
      />

      <div className="min-w-0 flex-1">
        <div
          className="
            text-sm
            font-medium
            text-zinc-800
          "
        >
          {propName}
        </div>

        <div
          className="
            text-xs
            text-zinc-500
            truncate
          "
        >
          {eventName}
        </div>
      </div>

      <Link
        data-editor-ignore
        to={`/scripts/${encodeURIComponent(eventName)}`}
        className="
          shrink-0
          text-xs
          font-medium
          text-sky-600
          hover:text-sky-700
          hover:underline
        "
      >
        Open script
      </Link>
    </div>
  );
}