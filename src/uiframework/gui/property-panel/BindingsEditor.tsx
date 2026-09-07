import type { Binding } from "../../core/document";

export function BindingsEditor({
  nodeId,
  definitions,
  bindings,
  setBinding,
}: {
  nodeId: string;
  definitions: Record<string, { label: string }>;
  bindings: Record<string, Binding> | undefined;
  setBinding: (
    nodeId: string,
    property: string,
    binding: Binding | null
  ) => void;
}) {
  return (
    <div className="pt-4 border-t border-[var(--editor-border)] space-y-3">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">
          Bindings
        </div>
        <div className="mt-1 text-xs text-[var(--editor-text-soft)]">
          Bind component properties to runtime tags.
        </div>
      </div>

      {Object.entries(definitions).map(([property, definition]) => {
        const current = bindings?.[property];
        const value = current?.kind === "tag" ? current.path : "";

        return (
          <label key={property} className="block space-y-1.5">
            <span className="text-xs font-medium text-[var(--editor-text-muted)]">
              {definition.label} · {property}
            </span>
            <input
              data-editor-ignore
              type="text"
              value={value}
              placeholder="pump.speed"
              onChange={(event) => {
                const path = event.target.value.trim();
                setBinding(
                  nodeId,
                  property,
                  path ? { kind: "tag", path } : null
                );
              }}
              className="h-9 w-full rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface)] px-3 text-sm text-[var(--editor-text)] outline-none transition focus:border-[var(--editor-accent-border)] focus:ring-2 focus:ring-[var(--editor-accent-soft)]"
            />
          </label>
        );
      })}
    </div>
  );
}
