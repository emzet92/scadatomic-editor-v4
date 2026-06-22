import type { UiNode } from "./property-panel-types";

export function PropertyPanelHeader({
  node,
}: {
  node: UiNode;
}) {
  return (
    <div
      className="
        px-4
        py-4
        border-b
        border-zinc-200
        bg-white
      "
    >
      <div
        className="
          text-xs
          font-semibold
          uppercase
          tracking-wide
          text-zinc-500
        "
      >
        Component
      </div>

      <div
        className="
          mt-1
          text-sm
          font-semibold
          text-zinc-900
        "
      >
        {node.type}
      </div>

      <div
        className="
          text-xs
          text-zinc-500
          truncate
        "
      >
        {node.id}
      </div>
    </div>
  );
}
