import type { ComponentRegistry } from "../../registry/editor-registry";

export function DragPreview({
  registry,
  type,
  props,
  x,
  y,
}: {
  registry: ComponentRegistry;
  type: string;
  props: Record<string, unknown>;
  x: number;
  y: number;
}) {
  const PreviewComponent = registry[type];
  if (!PreviewComponent) {
    return null;
  }

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
      <PreviewComponent {...props} />
    </div>
  );
}
