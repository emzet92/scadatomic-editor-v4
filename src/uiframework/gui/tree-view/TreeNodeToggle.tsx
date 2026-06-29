import {
  ChevronRight,
  ChevronDown,
} from "lucide-react";

export function TreeNodeToggle({
  collapsed,
  hasChildren,
  setCollapsed,
}: {
  collapsed: boolean;
  hasChildren: boolean;
  setCollapsed: (collapsed: boolean) => void;
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-center
        w-4
        h-4
        text-[var(--editor-text-soft)]
        hover:text-[var(--editor-accent)]
        shrink-0
        transition
      "
      onClick={(e) => {
        e.stopPropagation();

        if (hasChildren) {
          setCollapsed(!collapsed);
        }
      }}
    >
      {hasChildren ? (
        collapsed ? (
          <ChevronRight size={14} />
        ) : (
          <ChevronDown size={14} />
        )
      ) : (
        <div className="w-3" />
      )}
    </div>
  );
}