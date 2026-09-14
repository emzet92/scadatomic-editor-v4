import { Plus, Trash2, Type } from "lucide-react";
import { useMemo } from "react";
import type { TypographyWeight } from "../../design-system/typography";
import { countTypographyTokenUsages } from "../../design-system/document-typography";
import { useEditorStore } from "../../editor-store";
import { Button, PanelCard, Select, TextInput } from "../ui";

export function TypographyLibraryWorkspace() {
  const document = useEditorStore((state) => state.document);
  const addTypographyToken = useEditorStore((state) => state.addTypographyToken);
  const addStarterTypographyPalette = useEditorStore((state) => state.addStarterTypographyPalette);
  const updateTypographyToken = useEditorStore((state) => state.updateTypographyToken);
  const deleteTypographyToken = useEditorStore((state) => state.deleteTypographyToken);

  const tokens = useMemo(
    () => Object.values(document.designSystem?.typography ?? {}).sort((a, b) => a.name.localeCompare(b.name)),
    [document.designSystem?.typography]
  );

  return (
    <div className="mx-auto w-full max-w-6xl p-8">
      <div className="mb-7 flex items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--editor-accent)]">
            <Type size={14} /> Design System
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--editor-text)]">Typography</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--editor-text-muted)]">
            Define reusable text styles once and reference them from Text components. Token references use stable IDs, so renaming styles is safe.
          </p>
        </div>
        <Button size="sm" variant="primary" onClick={() => addTypographyToken()}>
          <Plus size={14} /> Add text style
        </Button>
      </div>

      {tokens.length === 0 ? (
        <PanelCard className="flex min-h-56 flex-col items-center justify-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]">
            <Type size={20} />
          </div>
          <div className="text-sm font-semibold text-[var(--editor-text)]">No typography tokens yet</div>
          <div className="mt-1 max-w-md text-xs leading-5 text-[var(--editor-text-muted)]">
            Create a text style or seed a starter scale for display, headings, body, labels and captions.
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={() => addTypographyToken()}>
              <Plus size={14} /> Add text style
            </Button>
            <Button size="sm" variant="secondary" onClick={addStarterTypographyPalette}>
              Create starter scale
            </Button>
          </div>
        </PanelCard>
      ) : (
        <div className="space-y-3">
          {tokens.map((token) => {
            const usageCount = countTypographyTokenUsages(document, token.id);
            return (
              <div
                key={token.id}
                className="grid grid-cols-[minmax(210px,1fr)_minmax(260px,1.6fr)_86px] gap-4 rounded-2xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-4 shadow-sm"
              >
                <div className="space-y-2">
                  <TextInput
                    aria-label="Typography token name"
                    value={token.name}
                    onChange={(event) => updateTypographyToken(token.id, { name: event.target.value })}
                  />
                  <div className="text-[10px] text-[var(--editor-text-soft)]">
                    {usageCount === 0 ? "Unused" : `${usageCount} ${usageCount === 1 ? "use" : "uses"}`}
                  </div>
                </div>

                <div className="space-y-3">
                  <div
                    className="min-h-14 rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] px-4 py-3 text-[var(--editor-text)]"
                    style={{
                      fontFamily: token.fontFamily,
                      fontSize: token.fontSize,
                      fontWeight: weightToCss(token.fontWeight),
                      lineHeight: token.lineHeight,
                      letterSpacing: token.letterSpacing,
                    }}
                  >
                    The quick brown fox jumps over the lazy dog
                  </div>

                  <div className="grid grid-cols-[minmax(180px,1.4fr)_90px_120px_90px_90px] gap-2">
                    <TextInput
                      aria-label="Font family"
                      value={token.fontFamily}
                      onChange={(event) => updateTypographyToken(token.id, { fontFamily: event.target.value })}
                    />
                    <TextInput
                      aria-label="Font size"
                      type="number"
                      min={1}
                      value={token.fontSize}
                      onChange={(event) => updateTypographyToken(token.id, { fontSize: Number(event.target.value) })}
                    />
                    <Select
                      aria-label="Font weight"
                      value={token.fontWeight}
                      onChange={(event) => updateTypographyToken(token.id, { fontWeight: event.target.value as TypographyWeight })}
                    >
                      <option value="normal">Regular</option>
                      <option value="medium">Medium</option>
                      <option value="semibold">Semibold</option>
                      <option value="bold">Bold</option>
                    </Select>
                    <TextInput
                      aria-label="Line height"
                      value={token.lineHeight}
                      onChange={(event) => updateTypographyToken(token.id, { lineHeight: event.target.value })}
                    />
                    <TextInput
                      aria-label="Letter spacing"
                      type="number"
                      step={0.1}
                      value={token.letterSpacing}
                      onChange={(event) => updateTypographyToken(token.id, { letterSpacing: Number(event.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex items-start justify-end">
                  <button
                    type="button"
                    title="Delete style and detach usages"
                    onClick={() => deleteTypographyToken(token.id)}
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
        Deleting a typography token detaches every reference to an equivalent local text style, preserving the visual result.
      </div>
    </div>
  );
}

function weightToCss(weight: TypographyWeight) {
  return weight === "bold" ? 700 : weight === "semibold" ? 600 : weight === "medium" ? 500 : 400;
}
