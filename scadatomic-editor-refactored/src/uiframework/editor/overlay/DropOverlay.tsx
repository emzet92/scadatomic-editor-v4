import type {
  DropIndicatorRect,
  DropTarget,
  RectInfo,
} from "../interaction/geometry";

const selectedColor = "var(--editor-selected)";
const selectedSoftColor = "var(--editor-selected-soft)";

export function NodeBoundsOverlay({
  rects,
  dropTarget,
}: {
  rects: readonly RectInfo[];
  dropTarget: DropTarget | null;
}) {
  return (
    <>
      {rects.map((rect) => (
        <div
          key={rect.id}
          style={{
            position: "fixed",
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            border: "1px dashed rgba(79, 70, 229, 0.22)",
            boxSizing: "border-box",
            pointerEvents: "none",
            zIndex: 9998,
            background:
              dropTarget?.parentId === rect.id
                ? "rgba(79, 70, 229, 0.08)"
                : undefined,
          }}
        />
      ))}
    </>
  );
}

export function DropIndicator({
  rect,
}: {
  rect: DropIndicatorRect | null;
}) {
  if (!rect) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        background: selectedColor,
        borderRadius: 999,
        boxShadow: `0 0 0 3px ${selectedSoftColor}`,
        pointerEvents: "none",
        zIndex: 20000,
      }}
    />
  );
}
