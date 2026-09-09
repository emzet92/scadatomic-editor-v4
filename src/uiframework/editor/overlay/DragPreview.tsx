import type { ComponentRegistry } from "../../registry/editor-registry";

export function DragPreview({
  registry,
  type,
  props,
  x,
  y,
  label,
}: {
  registry: ComponentRegistry;
  type: string;
  props: Record<string, unknown>;
  x: number;
  y: number;
  label?: string | undefined;
}) {
  const PreviewComponent = registry[type];

  return (
    <div
      style={{
        position: "fixed",
        left: x + 12,
        top: y + 12,
        zIndex: 99999,
        pointerEvents: "none",
        opacity: 0.75,
      }}
    >
      {PreviewComponent ? (
        <PreviewComponent {...props} />
      ) : (
        <div
          style={{
            minWidth: 150,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #c4b5fd",
            background: "rgba(245,243,255,.96)",
            color: "#6d28d9",
            fontSize: 12,
            fontWeight: 600,
            boxShadow: "0 6px 20px rgba(15,23,42,.12)",
          }}
        >
          {label ?? type}
        </div>
      )}
    </div>
  );
}
