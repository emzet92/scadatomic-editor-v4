import { MoveHorizontal, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { countSpacingTokenUsages } from "../../design-system/document-spacing";
import { useEditorStore } from "../../editor-store";
import { Button, PanelCard, TextInput } from "../ui";

export function SpacingLibraryWorkspace() {
  const document = useEditorStore((state) => state.document);
  const addSpacingToken = useEditorStore((state) => state.addSpacingToken);
  const addStarterSpacingScale = useEditorStore((state) => state.addStarterSpacingScale);
  const updateSpacingToken = useEditorStore((state) => state.updateSpacingToken);
  const deleteSpacingToken = useEditorStore((state) => state.deleteSpacingToken);

  const tokens = useMemo(
    () => Object.values(document.designSystem?.spacing ?? {}).sort((a, b) => {
      if (a.value !== b.value) return a.value - b.value;
      return a.name.localeCompare(b.name);
    }),
    [document.designSystem?.spacing]
  );

  return (
    <div className="mx-auto w-full max-w-6xl p-8">
      <div className="mb-7 flex items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--editor-accent)]">
            <MoveHorizontal size={14} /> Design System
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--editor-text)]">Spacing</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--editor-text-muted)]">
            Define a shared spacing scale for padding, gaps and margins. Components reference stable token IDs, so renaming a spacing step is safe.
          </p>
        </div>
        <Button size="sm" variant="primary" onClick={() => addSpacingToken()}>
          <Plus size={14} /> Add spacing
        </Button>
      </div>

      {tokens.length === 0 ? (
        <PanelCard className="flex min-h-56 flex-col items-center justify-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]">
            <MoveHorizontal size={20} />
          </div>
          <div className="text-sm font-semibold text-[var(--editor-text)]">No spacing tokens yet</div>
          <div className="mt-1 max-w-md text-xs leading-5 text-[var(--editor-text-muted)]">
            Create individual values or seed a practical 2 / 4 / 8 / 16 / 24 / 32 / 48 px scale.
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={() => addSpacingToken()}>
              <Plus size={14} /> Add spacing
            </Button>
            <Button size="sm" variant="secondary" onClick={addStarterSpacingScale}>
              Create starter scale
            </Button>
          </div>
        </PanelCard>
      ) : (
        <div className="space-y-3">
          {tokens.map((token) => {
            const usageCount = countSpacingTokenUsages(document, token.id);
            return (
              <div
                key={token.id}
                className="grid grid-cols-[minmax(210px,1fr)_minmax(240px,1.3fr)_130px_48px] items-center gap-4 rounded-2xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-4 shadow-sm"
              >
                <div className="space-y-2">
                  <TextInput
                    aria-label="Spacing token name"
                    value={token.name}
                    onChange={(event) => updateSpacingToken(token.id, { name: event.target.value })}
                  />
                  <div className="text-[10px] text-[var(--editor-text-soft)]">
                    {usageCount === 0 ? "Unused" : `${usageCount} ${usageCount === 1 ? "use" : "uses"}`}
                  </div>
                </div>

                <div className="flex min-h-12 items-center rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] px-4">
                  <div
                    className="h-3 rounded-full bg-[var(--editor-accent)] transition-[width]"
                    style={{ width: `${Math.max(2, Math.min(240, token.value * 4))}px` }}
                  />
                  <span className="ml-3 text-xs text-[var(--editor-text-muted)]">
                    {token.value}px
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <TextInput
                    aria-label="Spacing value"
                    type="number"
                    min={0}
                    step={1}
                    value={token.value}
                    onChange={(event) =>
                      updateSpacingToken(token.id, { value: Math.max(0, Number(event.target.value)) })
                    }
                  />
                  <span className="text-xs text-[var(--editor-text-muted)]">px</span>
                </div>

                <button
                  type="button"
                  title="Delete spacing token and detach usages"
                  onClick={() => deleteSpacingToken(token.id)}
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
        Deleting a spacing token detaches every reference to its current numeric value, preserving the layout instead of leaving broken references.
      </div>
    </div>
  );
}
