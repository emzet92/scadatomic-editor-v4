import { useMemo, useState } from "react";
import {
  Box,
  ChartLine,
  Image as ImageIcon,
  Minus,
  Plus,
  RectangleHorizontal,
  Type,
} from "lucide-react";
import { defaultContainerProps } from "../../component-props";
import type { UiNode } from "../../core/document";
import type { RectInfo } from "../interaction/geometry";

const QUICK_ITEMS = [
  { type: "Text", label: "Text", icon: Type },
  { type: "Button", label: "Button", icon: RectangleHorizontal },
  { type: "Container", label: "Container", icon: Box },
  { type: "Chart", label: "Chart", icon: ChartLine },
  { type: "Image", label: "Image", icon: ImageIcon },
] as const;

export function ContainerGridOverlay({
  rect,
  node,
  childRects,
  renderedColumns,
  onQuickAdd,
  onSetColumns,
}: {
  rect: RectInfo;
  node: UiNode;
  childRects: readonly RectInfo[];
  renderedColumns: number;
  onQuickAdd: (type: string, insertIndex: number) => void;
  onSetColumns: (columns: number) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rawProps = node.props ?? {};
  const padding = asNumber(rawProps.padding, defaultContainerProps.padding, 0, 64);
  const gap = asNumber(rawProps.gap, defaultContainerProps.gap, 0, 64);
  const configuredColumns = asNumber(
    rawProps.columns,
    defaultContainerProps.columns,
    1,
    12
  );
  const minRowHeight = asNumber(
    rawProps.minRowHeight,
    defaultContainerProps.minRowHeight,
    24,
    480
  );
  const rowMode = rawProps.gridRowMode === "minimum" ? "minimum" : "content";
  const isAdaptive = rawProps.gridMode === "adaptive";
  const columns = Math.max(1, Math.min(12, Math.floor(renderedColumns || configuredColumns)));
  const children = node.children ?? [];
  const repeatManaged = node.contentBehavior?.kind === "repeat";
  const canQuickAdd = !repeatManaged;

  const geometry = useMemo(
    () =>
      calculateGridGeometry({
        rect,
        childRects,
        childCount: children.length,
        columns,
        padding,
        gap,
        minRowHeight,
        rowMode,
      }),
    [rect, childRects, children.length, columns, padding, gap, minRowHeight, rowMode]
  );

  return (
    <>
      <div
        data-editor-ignore
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 10001,
        }}
      >
        <div
          style={{
            position: "fixed",
            left: rect.left + padding,
            top: rect.top + padding,
            width: Math.max(0, rect.width - padding * 2),
            height: Math.max(0, rect.height - padding * 2),
            borderRadius: 12,
            background:
              "linear-gradient(rgba(79,70,229,.035), rgba(79,70,229,.035))",
            boxShadow: "inset 0 0 0 1px rgba(79,70,229,.12)",
            overflow: "hidden",
          }}
        >
          {geometry.verticalGuides.map((left, index) => (
            <div
              key={`v-${index}`}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left,
                width: gap,
                transform: "translateX(-50%)",
                background: "rgba(79,70,229,.035)",
                borderLeft: "1px dashed rgba(79,70,229,.20)",
                borderRight: "1px dashed rgba(79,70,229,.20)",
              }}
            />
          ))}

          {geometry.horizontalGuides.map((top, index) => (
            <div
              key={`h-${index}`}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top,
                height: Math.max(1, gap),
                transform: "translateY(-50%)",
                background: "rgba(79,70,229,.025)",
                borderTop: "1px dashed rgba(79,70,229,.18)",
                borderBottom: "1px dashed rgba(79,70,229,.18)",
              }}
            />
          ))}

          {geometry.cells.map((cell) => (
            <div
              key={`${cell.row}:${cell.column}`}
              style={{
                position: "absolute",
                left: cell.left,
                top: cell.top,
                width: cell.width,
                height: cell.height,
                border: "1px dashed rgba(79,70,229,.18)",
                borderRadius: 10,
                boxSizing: "border-box",
              }}
            />
          ))}
        </div>

        <div
          style={{
            position: "fixed",
            left: rect.left + 10,
            top: rect.top + 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              height: 30,
              padding: "0 10px",
              borderRadius: 15,
              border: "1px solid rgba(79,70,229,.18)",
              background: "rgba(255,255,255,.94)",
              color: "var(--editor-text)",
              boxShadow: "0 5px 18px rgba(15,23,42,.10)",
              backdropFilter: "blur(12px)",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--editor-accent)",
                boxShadow: "0 0 0 4px rgba(79,70,229,.10)",
              }}
            />
            {isAdaptive ? `Adaptive · ${columns} visible` : `${configuredColumns} columns`}
          </div>

          {!isAdaptive ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: 30,
                padding: 3,
                borderRadius: 15,
                border: "1px solid var(--editor-border)",
                background: "rgba(255,255,255,.96)",
                boxShadow: "0 5px 18px rgba(15,23,42,.08)",
                pointerEvents: "auto",
              }}
            >
              <GridAdjustButton
                label="Remove column"
                disabled={configuredColumns <= 1}
                onClick={() => onSetColumns(Math.max(1, configuredColumns - 1))}
              >
                <Minus size={12} />
              </GridAdjustButton>
              <GridAdjustButton
                label="Add column"
                disabled={configuredColumns >= 12}
                onClick={() => onSetColumns(Math.min(12, configuredColumns + 1))}
              >
                <Plus size={12} />
              </GridAdjustButton>
            </div>
          ) : null}

          {repeatManaged ? (
            <div
              title="Children are generated by the repeat source. Switch Content mode to Static to add components manually."
              style={{
                display: "flex",
                alignItems: "center",
                height: 30,
                padding: "0 10px",
                borderRadius: 15,
                border: "1px solid rgba(245,158,11,.28)",
                background: "rgba(255,251,235,.96)",
                color: "#92400e",
                boxShadow: "0 5px 18px rgba(15,23,42,.06)",
                pointerEvents: "auto",
                fontSize: 10,
                fontWeight: 650,
              }}
            >
              Loop-managed · add disabled
            </div>
          ) : null}
        </div>

        {canQuickAdd ? (
          <button
            type="button"
            aria-label="Add component to container"
            title="Add component"
            onClick={() => setMenuOpen((current) => !current)}
            style={{
              position: "fixed",
              left: geometry.addButton.left - 18,
              top: geometry.addButton.top - 18,
              width: 36,
              height: 36,
              borderRadius: 18,
              border: "1px solid rgba(79,70,229,.25)",
              background: "var(--editor-accent)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "auto",
              cursor: "pointer",
              boxShadow: "0 7px 20px rgba(79,70,229,.28)",
            }}
          >
            <Plus size={17} strokeWidth={2.3} />
          </button>
        ) : null}
      </div>

      {menuOpen && canQuickAdd ? (
        <div
          data-editor-ignore
          style={{
            position: "fixed",
            left: Math.min(
              window.innerWidth - 210,
              Math.max(12, geometry.addButton.left + 24)
            ),
            top: Math.min(
              window.innerHeight - 250,
              Math.max(12, geometry.addButton.top - 18)
            ),
            width: 188,
            padding: 8,
            borderRadius: 20,
            border: "1px solid var(--editor-border)",
            background: "rgba(255,255,255,.98)",
            boxShadow: "0 18px 55px rgba(15,23,42,.18)",
            backdropFilter: "blur(18px)",
            zIndex: 10020,
          }}
        >
          <div style={{ padding: "6px 8px 8px" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--editor-text)",
              }}
            >
              Add to container
            </div>
            <div
              style={{
                marginTop: 2,
                fontSize: 10,
                lineHeight: "14px",
                color: "var(--editor-text-muted)",
              }}
            >
              The grid places it in the next safe slot.
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
            {QUICK_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => {
                    onQuickAdd(item.type, children.length);
                    setMenuOpen(false);
                  }}
                  style={{
                    minHeight: 66,
                    padding: 8,
                    borderRadius: 14,
                    border: "1px solid transparent",
                    background: "var(--editor-surface-muted)",
                    color: "var(--editor-text)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      width: 26,
                      height: 26,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 10,
                      background: "var(--editor-accent-soft)",
                      color: "var(--editor-accent)",
                    }}
                  >
                    <Icon size={14} />
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 650 }}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );
}

function GridAdjustButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        border: 0,
        background: "transparent",
        color: disabled ? "var(--editor-text-soft)" : "var(--editor-accent)",
        cursor: disabled ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}

function calculateGridGeometry({
  rect,
  childRects,
  childCount,
  columns,
  padding,
  gap,
  minRowHeight,
  rowMode,
}: {
  rect: RectInfo;
  childRects: readonly RectInfo[];
  childCount: number;
  columns: number;
  padding: number;
  gap: number;
  minRowHeight: number;
  rowMode: "content" | "minimum";
}) {
  const innerWidth = Math.max(24, rect.width - padding * 2);
  const cellWidth = Math.max(
    24,
    (innerWidth - gap * Math.max(0, columns - 1)) / columns
  );
  const rows = Math.max(1, Math.ceil((childCount + 1) / columns));
  const rowHeights = Array.from({ length: rows }, (_, row) => {
    const rowRects = childRects.filter((child) => {
      const childIndex = child.childIndex ?? -1;
      return Math.floor(childIndex / columns) === row;
    });
    const contentHeight = rowRects.length
      ? Math.max(...rowRects.map((child) => child.height))
      : 40;
    return rowMode === "minimum"
      ? Math.max(minRowHeight, contentHeight)
      : Math.max(32, contentHeight);
  });
  const rowTops = rowHeights.map((_, row) =>
    rowHeights.slice(0, row).reduce((sum, height) => sum + height, 0) + row * gap
  );

  const cells = Array.from({ length: rows * columns }).map((_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    return {
      row,
      column,
      left: column * (cellWidth + gap),
      top: rowTops[row] ?? 0,
      width: cellWidth,
      height: rowHeights[row] ?? 40,
    };
  });

  const verticalGuides = Array.from({ length: Math.max(0, columns - 1) }).map(
    (_, index) => (index + 1) * cellWidth + index * gap + gap / 2
  );
  const horizontalGuides = Array.from({ length: Math.max(0, rows - 1) }).map(
    (_, index) => (rowTops[index + 1] ?? 0) - gap / 2
  );

  const nextIndex = childCount;
  const nextColumn = nextIndex % columns;
  const nextRow = Math.floor(nextIndex / columns);
  const nextRowRects = childRects.filter((child) => {
    const childIndex = child.childIndex ?? -1;
    return Math.floor(childIndex / columns) === nextRow;
  });
  const previousRowRects = childRects.filter((child) => {
    const childIndex = child.childIndex ?? -1;
    return Math.floor(childIndex / columns) === nextRow - 1;
  });

  const computedRowTop = nextRowRects.length
    ? Math.min(...nextRowRects.map((child) => child.top))
    : previousRowRects.length
      ? Math.max(...previousRowRects.map((child) => child.bottom)) + gap
      : rect.top + padding + (rowTops[nextRow] ?? 0);

  const unclampedLeft =
    rect.left + padding + nextColumn * (cellWidth + gap) + cellWidth / 2;
  const unclampedTop = computedRowTop + (rowHeights[nextRow] ?? 40) / 2;

  return {
    cells,
    verticalGuides,
    horizontalGuides,
    addButton: {
      left: clamp(unclampedLeft, rect.left + 22, rect.right - 22),
      top: clamp(unclampedTop, rect.top + 44, rect.bottom - 22),
    },
  };
}

function asNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number
) {
  const number = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.max(min, Math.min(max, number));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
