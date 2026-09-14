import { Copy, Palette, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { ColorToken } from "../../design-system/colors";
import { countColorTokenUsages } from "../../design-system/document-colors";
import { useEditorStore } from "../../editor-store";
import { Button, ColorPickerInput, PanelCard, TextInput } from "../ui";

export function ColorLibraryWorkspace() {
  const document = useEditorStore((state) => state.document);
  const addColorToken = useEditorStore((state) => state.addColorToken);
  const addStarterColorPalette = useEditorStore((state) => state.addStarterColorPalette);
  const updateColorToken = useEditorStore((state) => state.updateColorToken);
  const deleteColorToken = useEditorStore((state) => state.deleteColorToken);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const colors = useMemo(
    () => Object.values(document.designSystem?.colors ?? {}).sort((a, b) => a.name.localeCompare(b.name)),
    [document.designSystem?.colors]
  );

  async function copyToken(token: ColorToken) {
    try {
      await navigator.clipboard.writeText(token.value);
      setCopiedId(token.id);
      window.setTimeout(() => setCopiedId((current) => (current === token.id ? null : current)), 1000);
    } catch {
      // Clipboard access can be unavailable in sandboxed designer frames.
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-8">
      <div className="mb-7 flex items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--editor-accent)]">
            <Palette size={14} /> Design System
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--editor-text)]">Color library</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--editor-text-muted)]">
            Define named project colors once and reference them from component properties and variants. Rename safely; references use stable IDs.
          </p>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={() => addColorToken({ name: "Color", value: "#7c3aed" })}
        >
          <Plus size={14} /> Add color
        </Button>
      </div>

      {colors.length === 0 ? (
        <PanelCard className="flex min-h-56 flex-col items-center justify-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]">
            <Palette size={20} />
          </div>
          <div className="text-sm font-semibold text-[var(--editor-text)]">No color tokens yet</div>
          <div className="mt-1 max-w-md text-xs leading-5 text-[var(--editor-text-muted)]">
            Create a color or seed a starter palette for brand, surfaces, text and status colors.
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={() => addColorToken()}>
              <Plus size={14} /> Add color
            </Button>
            <Button size="sm" variant="secondary" onClick={addStarterColorPalette}>
              Create starter palette
            </Button>
          </div>
        </PanelCard>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--editor-border)] bg-[var(--editor-surface)] shadow-sm">
          <div className="grid grid-cols-[56px_minmax(180px,1.3fr)_minmax(160px,.8fr)_100px_84px] items-center gap-3 border-b border-[var(--editor-border)] bg-[var(--editor-surface-muted)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">
            <span>Color</span>
            <span>Name</span>
            <span>Value</span>
            <span>Usage</span>
            <span className="text-right">Actions</span>
          </div>
          {colors.map((token) => {
            const usageCount = countColorTokenUsages(document, token.id);
            return (
              <div
                key={token.id}
                className="grid grid-cols-[56px_minmax(180px,1.3fr)_minmax(160px,.8fr)_100px_84px] items-center gap-3 border-b border-[var(--editor-border)] px-4 py-3 last:border-b-0"
              >
                <div className="flex items-center justify-center">
                  <ColorPickerInput
                    compact
                    ariaLabel={`Choose ${token.name}`}
                    value={token.value}
                    onChange={(value) => updateColorToken(token.id, { value })}
                    showValue={false}
                  />
                </div>

                <TextInput
                  aria-label="Color token name"
                  value={token.name}
                  onChange={(event) => updateColorToken(token.id, { name: event.target.value })}
                />

                <div className="flex items-center gap-2">
                  <TextInput
                    aria-label="Color value"
                    value={token.value}
                    onChange={(event) => updateColorToken(token.id, { value: event.target.value })}
                  />
                </div>

                <div className="text-xs text-[var(--editor-text-muted)]">
                  {usageCount === 0 ? "Unused" : `${usageCount} ${usageCount === 1 ? "use" : "uses"}`}
                </div>

                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    title={copiedId === token.id ? "Copied" : "Copy value"}
                    onClick={() => void copyToken(token)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--editor-text-muted)] transition hover:bg-[var(--editor-surface-muted)] hover:text-[var(--editor-text)]"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    title="Delete token and detach usages"
                    onClick={() => deleteColorToken(token.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--editor-text-muted)] transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] p-4 text-xs leading-5 text-[var(--editor-text-muted)]">
        Deleting a token detaches every reference to its current literal value. The UI keeps the same appearance instead of leaving broken references.
      </div>
    </div>
  );
}
