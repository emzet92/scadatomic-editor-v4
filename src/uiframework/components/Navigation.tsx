import { ChevronDown, ChevronRight } from "lucide-react";
import { useState, type HTMLAttributes } from "react";
import type { NavigationTreeNode } from "../navigation/navigation";
import { useNavigationRuntime } from "../navigation/useNavigationRuntime";
import type { NavigationNodeProps } from "../component-props";

type NavigationProps = HTMLAttributes<HTMLElement> & NavigationNodeProps;

export function Navigation({
  backgroundColor = "#ffffff",
  color = "#52525b",
  activeColor = "#7c3aed",
  gap = 4,
  padding = 4,
  borderRadius = 8,
  style,
  ...props
}: NavigationProps) {
  const navigation = useNavigationRuntime();
  const items = navigation?.items ?? [];

  return (
    <nav
      {...props}
      aria-label="Page navigation"
      style={{
        ...style,
        display: "flex",
        alignItems: "center",
        gap,
        padding,
        borderRadius,
        backgroundColor,
        overflow: "visible",
      }}
    >
      {items.length > 0 ? (
        items.map((item) => (
          <NavigationMenuItem
            key={item.pageId}
            item={item}
            currentPageId={navigation?.currentPageId}
            navigateTo={navigation?.navigateTo}
            color={color}
            activeColor={activeColor}
            borderRadius={borderRadius}
            depth={0}
          />
        ))
      ) : (
        <span style={{ padding: "7px 10px", color, fontSize: 12 }}>
          Add pages to build navigation
        </span>
      )}
    </nav>
  );
}

function NavigationMenuItem({
  item,
  currentPageId,
  navigateTo,
  color,
  activeColor,
  borderRadius,
  depth,
}: {
  item: NavigationTreeNode;
  currentPageId: string | undefined;
  navigateTo: ((path: string) => void) | undefined;
  color: string;
  activeColor: string;
  borderRadius: number;
  depth: number;
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = item.children.length > 0;
  const active = isNavigationBranchActive(item, currentPageId);
  const current = item.pageId === currentPageId;

  const buttonStyle = {
    height: 34,
    border: 0,
    background: active ? `${activeColor}18` : "transparent",
    color: active ? activeColor : color,
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    cursor: navigateTo ? "pointer" : "default",
  } as const;

  return (
    <div
      style={{
        position: "relative",
        display: depth === 0 ? "inline-flex" : "flex",
        width: depth === 0 ? "auto" : "100%",
        alignItems: "center",
      }}
      onMouseEnter={() => {
        if (hasChildren) setOpen(true);
      }}
      onMouseLeave={() => {
        if (hasChildren) setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => {
          navigateTo?.(item.path);
          setOpen(false);
        }}
        aria-current={current ? "page" : undefined}
        style={{
          ...buttonStyle,
          flex: depth === 0 ? "0 1 auto" : "1 1 auto",
          minWidth: 0,
          padding: hasChildren ? "0 8px 0 12px" : "0 12px",
          borderRadius: hasChildren
            ? `${Math.max(4, borderRadius - 2)}px 0 0 ${Math.max(
                4,
                borderRadius - 2
              )}px`
            : Math.max(4, borderRadius - 2),
          textAlign: "left",
          whiteSpace: "nowrap",
        }}
      >
        {item.name}
      </button>

      {hasChildren ? (
        <button
          type="button"
          aria-label={`${open ? "Collapse" : "Expand"} ${item.name}`}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={(event) => {
            event.stopPropagation();
            setOpen((value) => !value);
          }}
          style={{
            ...buttonStyle,
            width: 30,
            flex: "0 0 30px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            borderRadius: `0 ${Math.max(4, borderRadius - 2)}px ${Math.max(
              4,
              borderRadius - 2
            )}px 0`,
          }}
        >
          {depth === 0 ? (
            <ChevronDown
              size={13}
              style={{
                transform: open ? "rotate(180deg)" : "none",
                transition: "transform 120ms ease",
              }}
            />
          ) : (
            <ChevronRight size={13} />
          )}
        </button>
      ) : null}

      {hasChildren && open ? (
        <div
          role="menu"
          style={{
            position: "absolute",
            zIndex: 100,
            top: depth === 0 ? "calc(100% + 4px)" : -4,
            left: depth === 0 ? 0 : "calc(100% + 4px)",
            minWidth: 180,
            padding: 4,
            border: "1px solid rgba(0,0,0,0.10)",
            borderRadius: Math.max(6, borderRadius),
            backgroundColor: "#ffffff",
            boxShadow:
              "0 10px 28px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(15, 23, 42, 0.08)",
          }}
        >
          {item.children.map((child) => (
            <NavigationMenuItem
              key={child.pageId}
              item={child}
              currentPageId={currentPageId}
              navigateTo={navigateTo}
              color={color}
              activeColor={activeColor}
              borderRadius={borderRadius}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function isNavigationBranchActive(
  item: NavigationTreeNode,
  currentPageId: string | undefined
): boolean {
  if (!currentPageId) return false;
  if (item.pageId === currentPageId) return true;
  return item.children.some((child) =>
    isNavigationBranchActive(child, currentPageId)
  );
}
