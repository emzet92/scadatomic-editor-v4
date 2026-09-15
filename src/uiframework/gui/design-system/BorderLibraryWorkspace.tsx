import { Plus, Square, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { countBorderTokenUsages } from "../../design-system/document-borders";
import {
  borderStyleToCss,
  type BorderLineStyle,
} from "../../design-system/borders";
import { useEditorStore } from "../../editor-store";
import { Button, ColorPickerInput, PanelCard, Select, TextInput } from "../ui";

const BORDER_STYLES: BorderLineStyle[] = ["solid", "dashed", "dotted", "double"];

export function BorderLibraryWorkspace() {
  const document = useEditorStore((state) => state.document);
  const addBorderToken = useEditorStore((state) => state.addBorderToken);
  const addStarterBorderScale = useEditorStore((state) => state.addStarterBorderScale);
  const updateBorderToken = useEditorStore((state) => state.updateBorderToken);
  const deleteBorderToken = useEditorStore((state) => state.deleteBorderToken);

  const tokens = useMemo(
    () => Object.values(document.designSystem?.borders ?? {}).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
    [document.designSystem?.borders]
  );

  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-7 flex items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--editor-accent)]">
            <Square size={14} /> Design System
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--editor-text)]">Borders / Stroke Styles</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--editor-text-muted)]">
            Define reusable structural strokes with width, line style and color. Components reference the token by stable ID while renderers receive a final border value.
          </p>
        </div>
        <Button size="sm" variant="primary" onClick={() => addBorderToken()}>
          <Plus size={14} /> Add stroke
        </Button>
      </div>

      {tokens.length === 0 ? (
        <PanelCard className="flex min-h-56 flex-col items-center justify-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]">
            <Square size={20} />
          </div>
          <div className="text-sm font-semibold text-[var(--editor-text)]">No border tokens yet</div>
          <div className="mt-1 max-w-md text-xs leading-5 text-[var(--editor-text-muted)]">
            Create individual strokes or seed a practical Subtle / Default / Strong / Focus / Dashed starter set.
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={() => addBorderToken()}>
              <Plus size={14} /> Add stroke
            </Button>
            <Button size="sm" variant="secondary" onClick={addStarterBorderScale}>
              Create starter strokes
            </Button>
          </div>
        </PanelCard>
      ) : (
        <div className="space-y-3">
          {tokens.map((token) => {
            const usageCount = countBorderTokenUsages(document, token.id);
            return (
              <div
                key={token.id}
                className="grid grid-cols-[minmax(190px,.9fr)_minmax(210px,1fr)_minmax(360px,1.7fr)_44px] items-center gap-4 rounded-2xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-4 shadow-sm"
              >
                <div className="space-y-2">
                  <TextInput
                    aria-label="Border token name"
                    value={token.name}
                    onChange={(event) => updateBorderToken(token.id, { name: event.target.value })}
                  />
                  <div className="text-[10px] text-[var(--editor-text-soft)]">
                    {usageCount === 0 ? "Unused" : `${usageCount} ${usageCount === 1 ? "use" : "uses"}`}
                  </div>
                </div>

                <div className="flex h-20 items-center justify-center rounded-xl border border-[var(--editor-border)] bg-[var(--editor-canvas-bg)]">
                  <div
                    className="h-10 w-24 rounded-xl bg-[var(--editor-surface)]"
                    style={{ border: borderStyleToCss(token), boxSizing: "border-box" }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-[120px_minmax(140px,1fr)] gap-2">
                    <label className="min-w-0">
                      <span className="mb-1 block text-[9px] uppercase tracking-wide text-[var(--editor-text-soft)]">Width</span>
                      <TextInput
                        controlSize="sm"
                        aria-label={`${token.name} width`}
                        type="number"
                        min={0}
                        step={1}
                        value={token.width}
                        onChange={(event) => updateBorderToken(token.id, { width: Math.max(0, Number(event.target.value)) })}
                      />
                    </label>
                    <label className="min-w-0">
                      <span className="mb-1 block text-[9px] uppercase tracking-wide text-[var(--editor-text-soft)]">Style</span>
                      <Select
                        aria-label={`${token.name} line style`}
                        value={token.style}
                        onChange={(event) => updateBorderToken(token.id, { style: event.target.value as BorderLineStyle })}
                      >
                        {BORDER_STYLES.map((style) => (
                          <option key={style} value={style}>{style}</option>
                        ))}
                      </Select>
                    </label>
                  </div>
                  <ColorPickerInput
                    compact
                    ariaLabel={`${token.name} border color`}
                    value={token.color}
                    onChange={(color) => updateBorderToken(token.id, { color })}
                  />
                </div>

                <button
                  type="button"
                  title="Delete border token and detach usages"
                  onClick={() => deleteBorderToken(token.id)}
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
        Deleting a border token detaches every reference to a local structured stroke with the same width, style and color, preserving the rendered appearance.
      </div>
    </div>
  );
}
