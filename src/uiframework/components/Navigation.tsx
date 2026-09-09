import type { HTMLAttributes } from "react";
import type { NavigationTreeNode } from "../navigation/navigation";
import { useNavigationRuntime } from "../navigation/navigation-context";
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
      }}
    >
      {items.length > 0 ? (
        items.map((item) => {
          const active = isNavigationBranchActive(
            item,
            navigation?.currentPageId
          );
          return (
            <button
              key={item.pageId}
              type="button"
              onClick={() => navigation?.navigateTo(item.path)}
              style={{
                height: 34,
                padding: "0 12px",
                border: 0,
                borderRadius: Math.max(4, borderRadius - 2),
                background: active ? `${activeColor}18` : "transparent",
                color: active ? activeColor : color,
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                cursor: navigation ? "pointer" : "default",
              }}
            >
              {item.name}
            </button>
          );
        })
      ) : (
        <span style={{ padding: "7px 10px", color, fontSize: 12 }}>
          Add pages to build navigation
        </span>
      )}
    </nav>
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
