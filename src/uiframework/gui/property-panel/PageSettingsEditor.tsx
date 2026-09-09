import { Monitor, Smartphone, Tablet } from "lucide-react";
import type { UiNode } from "../../core/document";
import type { UpdateNode } from "./property-panel-types";

const presets = [
  { mode: "desktop", label: "Desktop", width: 1440, height: 900, icon: Monitor },
  { mode: "tablet", label: "Tablet", width: 834, height: 1194, icon: Tablet },
  { mode: "mobile", label: "Mobile", width: 390, height: 844, icon: Smartphone },
] as const;

export function PageSettingsEditor({
  node,
  updateNode,
}: {
  node: UiNode;
  updateNode: UpdateNode;
}) {
  const mode = String(node.props?.deviceMode ?? "desktop");
  const width = Number(node.props?.width ?? 1440);
  const height = Number(node.props?.height ?? 900);

  function setSize(property: "width" | "height", value: number) {
    updateNode(node.id, (current) => ({
      ...current,
      props: { ...(current.props ?? {}), [property]: value },
    }));
  }

  return (
    <section>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">
        Page viewport
      </div>

      <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-[var(--editor-border)] bg-[var(--editor-surface)]">
        {presets.map((preset) => {
          const Icon = preset.icon;
          const active = mode === preset.mode;
          return (
            <button
              key={preset.mode}
              type="button"
              onClick={() =>
                updateNode(node.id, (current) => ({
                  ...current,
                  props: {
                    ...(current.props ?? {}),
                    deviceMode: preset.mode,
                    width: preset.width,
                    height: preset.height,
                  },
                }))
              }
              className={`flex min-w-0 flex-col items-center gap-1 border-r border-[var(--editor-border)] px-2 py-2.5 text-[10px] font-medium transition last:border-r-0 ${
                active
                  ? "bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]"
                  : "text-[var(--editor-text-muted)] hover:bg-[var(--editor-surface-muted)]"
              }`}
            >
              <Icon size={14} />
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface)] px-2.5 py-2">
          <span className="block text-[9px] uppercase tracking-wide text-[var(--editor-text-muted)]">Width</span>
          <input
            type="number"
            min={240}
            value={width}
            onChange={(event) => setSize("width", Math.max(240, Number(event.target.value) || 240))}
            className="mt-1 w-full bg-transparent text-xs font-medium text-[var(--editor-text)] outline-none"
          />
        </label>
        <label className="rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface)] px-2.5 py-2">
          <span className="block text-[9px] uppercase tracking-wide text-[var(--editor-text-muted)]">Height</span>
          <input
            type="number"
            min={240}
            value={height}
            onChange={(event) => setSize("height", Math.max(240, Number(event.target.value) || 240))}
            className="mt-1 w-full bg-transparent text-xs font-medium text-[var(--editor-text)] outline-none"
          />
        </label>
      </div>
    </section>
  );
}
