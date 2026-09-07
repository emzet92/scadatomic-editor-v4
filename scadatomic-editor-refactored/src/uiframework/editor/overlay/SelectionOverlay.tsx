import { Trash2 } from "lucide-react";
import type { RectInfo } from "../interaction/geometry";

const selectedColor = "var(--editor-selected)";
const selectedSoftColor = "var(--editor-selected-soft)";
const editorSurface = "var(--editor-surface)";
const editorBorder = "var(--editor-border)";

export function SelectionOverlay({
  rect,
  nodeType,
  canDelete,
  onDelete,
}: {
  rect: RectInfo | null;
  nodeType?: string | undefined;
  canDelete: boolean;
  onDelete: () => void;
}) {
  if (!rect) {
    return null;
  }

  return (
    <>
      <div
        style={{
          position: "fixed",
          left: rect.left,
          top: rect.top - 28,
          display: "flex",
          alignItems: "center",
          gap: 4,
          zIndex: 10002,
        }}
      >
        <div
          style={{
            height: 24,
            padding: "0 8px",
            borderRadius: 6,
            background: selectedColor,
            color: "white",
            fontSize: 12,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            boxShadow: "0 1px 2px rgba(0,0,0,.10)",
          }}
        >
          {nodeType ?? "Node"}
        </div>

        {canDelete && (
          <button
            data-editor-ignore
            type="button"
            aria-label="Delete node"
            onClick={onDelete}
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              border: `1px solid ${editorBorder}`,
              background: editorSurface,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--editor-danger)",
              boxShadow: "0 1px 2px rgba(0,0,0,.08)",
            }}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div
        style={{
          position: "fixed",
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          border: `2px solid ${selectedColor}`,
          boxShadow: `0 0 0 3px ${selectedSoftColor}`,
          boxSizing: "border-box",
          pointerEvents: "none",
          zIndex: 10000,
        }}
      />

      <MeasurementLabel
        left={rect.left + rect.width / 2 - 20}
        top={rect.top - 20}
      >
        {Math.round(rect.width)}px
      </MeasurementLabel>

      <MeasurementLabel
        left={rect.left - 50}
        top={rect.top + rect.height / 2 - 10}
      >
        {Math.round(rect.height)}px
      </MeasurementLabel>

      <Handle x={rect.left} y={rect.top} />
      <Handle x={rect.right} y={rect.top} />
      <Handle x={rect.left} y={rect.bottom} />
      <Handle x={rect.right} y={rect.bottom} />
      <Handle x={rect.left + rect.width / 2} y={rect.top} />
      <Handle x={rect.left + rect.width / 2} y={rect.bottom} />
      <Handle x={rect.left} y={rect.top + rect.height / 2} />
      <Handle x={rect.right} y={rect.top + rect.height / 2} />
    </>
  );
}

function MeasurementLabel({
  left,
  top,
  children,
}: {
  left: number;
  top: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        left,
        top,
        fontSize: 11,
        background: selectedColor,
        color: "white",
        padding: "2px 6px",
        borderRadius: 4,
        boxShadow: "0 1px 2px rgba(0,0,0,.10)",
        zIndex: 10003,
      }}
    >
      {children}
    </div>
  );
}

function Handle({ x, y }: { x: number; y: number }) {
  return (
    <div
      style={{
        position: "fixed",
        left: x - 4,
        top: y - 4,
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: selectedColor,
        border: `1px solid ${editorSurface}`,
        boxShadow: `0 0 0 2px ${selectedSoftColor}`,
        pointerEvents: "none",
        zIndex: 10001,
      }}
    />
  );
}
