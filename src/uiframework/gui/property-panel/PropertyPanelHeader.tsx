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
        border-[var(--editor-border)]
        bg-[var(--editor-surface)]
      "
    >
      <div
        className="
          text-xs
          font-semibold
          uppercase
          tracking-wide
          text-[var(--editor-text-muted)]
        "
      >
        Component
      </div>

      <div
        className="
          mt-1
          text-sm
          font-semibold
          text-[var(--editor-text)]
        "
      >
        {node.type}
      </div>

      <div
        className="
          text-xs
          text-[var(--editor-text-muted)]
          truncate
        "
      >
        {node.id}
      </div>
    </div>
  );
}