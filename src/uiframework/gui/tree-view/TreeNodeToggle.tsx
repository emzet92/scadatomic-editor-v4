import { ChevronDown, ChevronRight } from "lucide-react";
import { IconButton,
  Box,
  Icon,
} from "../ui";

export function TreeNodeToggle({
  collapsed,
  hasChildren,
  setCollapsed,
}: {
  collapsed: boolean;
  hasChildren: boolean;
  setCollapsed: (collapsed: boolean) => void;
}) {
  if (!hasChildren) {
    return <Box className="size-4 shrink-0" aria-hidden="true" />;
  }

  return (
    <IconButton
      aria-label={collapsed ? "Expand node" : "Collapse node"}
      size="icon-xs"
      className="size-4 shrink-0 rounded-sm text-[var(--editor-text-soft)]"
      onClick={(event) => {
        event.stopPropagation();
        setCollapsed(!collapsed);
      }}
    >
      {collapsed ? <Icon glyph={ChevronRight} size={14} /> : <Icon glyph={ChevronDown} size={14} />}
    </IconButton>
  );
}
