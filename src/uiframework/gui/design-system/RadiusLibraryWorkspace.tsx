import { Plus, Radius, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { countRadiusTokenUsages } from "../../design-system/document-radius";
import { useEditorStore } from "../../editor-store";
import { Button, PanelCard, TextInput } from "../ui";

export function RadiusLibraryWorkspace() {
  const document = useEditorStore((state) => state.document);
  const addRadiusToken = useEditorStore((state) => state.addRadiusToken);
  const addStarterRadiusScale = useEditorStore((state) => state.addStarterRadiusScale);
  const updateRadiusToken = useEditorStore((state) => state.updateRadiusToken);
  const deleteRadiusToken = useEditorStore((state) => state.deleteRadiusToken);

  const tokens = useMemo(
    () => Object.values(document.designSystem?.radius ?? {}).sort((a, b) => {
      if (a.value !== b.value) return a.value - b.value;
      return a.name.localeCompare(b.name);
    }),
    [document.designSystem?.radius]
  );

  return (
    <div className="mx-auto w-full max-w-6xl p-8">
      <div className="mb-7 flex items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--editor-accent)]">
            <Radius size={14} /> Design System
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--editor-text)]">Radius</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--editor-text-muted)]">
            Define a shared corner-radius scale for buttons, containers, modals, images and other surfaces. Components reference stable token IDs, so renaming a radius step is safe.
          </p>
        </div>
        <Button size="sm" variant="primary" onClick={() => addRadiusToken()}>
          <Plus size={14} /> Add radius
        </Button>
      </div>

      {tokens.length === 0 ? (
        <PanelCard className="flex min-h-56 flex-col items-center justify-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]">
            <Radius size={20} />
          </div>
          <div className="text-sm font-semibold text-[var(--editor-text)]">No radius tokens yet</div>
          <div className="mt-1 max-w-md text-xs leading-5 text-[var(--editor-text-muted)]">
            Create individual values or seed a practical 0 / 2 / 4 / 8 / 12 / 16 / 24 / pill scale.
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={() => addRadiusToken()}>
              <Plus size={14} /> Add radius
            </Button>
            <Button size="sm" variant="secondary" onClick={addStarterRadiusScale}>
              Create starter scale
            </Button>
          </div>
        </PanelCard>
      ) : (
        <div className="space-y-3">
          {tokens.map((token) => {
            const usageCount = countRadiusTokenUsages(document, token.id);
            const previewRadius = Math.min(30, token.value);
            return (
              <div
                key={token.id}
                className="grid grid-cols-[minmax(210px,1fr)_minmax(240px,1.3fr)_130px_48px] items-center gap-4 rounded-2xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-4 shadow-sm"
              >
                <div className="space-y-2">
                  <TextInput
                    aria-label="Radius token name"
                    value={token.name}
                    onChange={(event) => updateRadiusToken(token.id, { name: event.target.value })}
                  />
                  <div className="text-[10px] text-[var(--editor-text-soft)]">
                    {usageCount === 0 ? "Unused" : `${usageCount} ${usageCount === 1 ? "use" : "uses"}`}
                  </div>
                </div>

                <div className="flex min-h-16 items-center gap-4 rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] px-4">
                  <div
                    className="h-10 w-16 border-2 border-[var(--editor-accent)] bg-[var(--editor-accent-soft)]"
                    style={{ borderRadius: `${previewRadius}px` }}
                  />
                  <div>
                    <div className="text-xs font-medium text-[var(--editor-text)]">{token.value}px</div>
                    <div className="mt-0.5 text-[10px] text-[var(--editor-text-muted)]">
                      {token.value >= 999 ? "Pill / fully rounded" : "Corner radius preview"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <TextInput
                    aria-label="Radius value"
                    type="number"
                    min={0}
                    step={1}
                    value={token.value}
                    onChange={(event) =>
                      updateRadiusToken(token.id, { value: Math.max(0, Number(event.target.value)) })
                    }
                  />
                  <span className="text-xs text-[var(--editor-text-muted)]">px</span>
                </div>

                <button
                  type="button"
                  title="Delete radius token and detach usages"
                  onClick={() => deleteRadiusToken(token.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--editor-text-muted)] transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] p-4 text-xs leading-5 text-[var(--editor-text-muted)]">
        Deleting a radius token detaches every reference to its current numeric value, preserving the visual shape instead of leaving broken references.
      </div>
    </div>
  );
}
