import { Layers, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { countShadowTokenUsages } from "../../design-system/document-shadows";
import { shadowStyleToCss } from "../../design-system/shadows";
import { useEditorStore } from "../../editor-store";
import { Button, ColorPickerInput, PanelCard, TextInput } from "../ui";

export function ShadowLibraryWorkspace() {
  const document = useEditorStore((state) => state.document);
  const addShadowToken = useEditorStore((state) => state.addShadowToken);
  const addStarterShadowScale = useEditorStore((state) => state.addStarterShadowScale);
  const updateShadowToken = useEditorStore((state) => state.updateShadowToken);
  const deleteShadowToken = useEditorStore((state) => state.deleteShadowToken);

  const tokens = useMemo(
    () => Object.values(document.designSystem?.shadows ?? {}).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
    [document.designSystem?.shadows]
  );

  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-7 flex items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--editor-accent)]">
            <Layers size={14} /> Design System
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--editor-text)]">Shadows / Elevation</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--editor-text-muted)]">
            Define structural elevation tokens with X/Y offset, blur, spread and color. Components keep stable token references while renderers receive the final shadow value.
          </p>
        </div>
        <Button size="sm" variant="primary" onClick={() => addShadowToken()}>
          <Plus size={14} /> Add shadow
        </Button>
      </div>

      {tokens.length === 0 ? (
        <PanelCard className="flex min-h-56 flex-col items-center justify-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]">
            <Layers size={20} />
          </div>
          <div className="text-sm font-semibold text-[var(--editor-text)]">No shadow tokens yet</div>
          <div className="mt-1 max-w-md text-xs leading-5 text-[var(--editor-text-muted)]">
            Create individual shadows or seed a practical Elevation/None through Elevation/4 scale.
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={() => addShadowToken()}>
              <Plus size={14} /> Add shadow
            </Button>
            <Button size="sm" variant="secondary" onClick={addStarterShadowScale}>
              Create elevation scale
            </Button>
          </div>
        </PanelCard>
      ) : (
        <div className="space-y-3">
          {tokens.map((token) => {
            const usageCount = countShadowTokenUsages(document, token.id);
            return (
              <div
                key={token.id}
                className="grid grid-cols-[minmax(190px,.9fr)_minmax(230px,1.1fr)_minmax(380px,1.8fr)_44px] items-center gap-4 rounded-2xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-4 shadow-sm"
              >
                <div className="space-y-2">
                  <TextInput
                    aria-label="Shadow token name"
                    value={token.name}
                    onChange={(event) => updateShadowToken(token.id, { name: event.target.value })}
                  />
                  <div className="text-[10px] text-[var(--editor-text-soft)]">
                    {usageCount === 0 ? "Unused" : `${usageCount} ${usageCount === 1 ? "use" : "uses"}`}
                  </div>
                </div>

                <div className="flex h-20 items-center justify-center rounded-xl border border-[var(--editor-border)] bg-[var(--editor-canvas-bg)]">
                  <div
                    className="h-10 w-24 rounded-xl bg-[var(--editor-surface)]"
                    style={{ boxShadow: shadowStyleToCss(token) }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-2">
                    <ShadowNumber label="X" value={token.x} onChange={(x) => updateShadowToken(token.id, { x })} />
                    <ShadowNumber label="Y" value={token.y} onChange={(y) => updateShadowToken(token.id, { y })} />
                    <ShadowNumber label="Blur" min={0} value={token.blur} onChange={(blur) => updateShadowToken(token.id, { blur: Math.max(0, blur) })} />
                    <ShadowNumber label="Spread" value={token.spread} onChange={(spread) => updateShadowToken(token.id, { spread })} />
                  </div>
                  <ColorPickerInput
                    compact
                    ariaLabel={`${token.name} shadow color`}
                    value={token.color}
                    onChange={(color) => updateShadowToken(token.id, { color })}
                  />
                </div>

                <button
                  type="button"
                  title="Delete shadow token and detach usages"
                  onClick={() => deleteShadowToken(token.id)}
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
        Deleting a shadow token detaches each reference to a local structured shadow with the same X/Y/blur/spread/color values, preserving the rendered elevation.
      </div>
    </div>
  );
}

function ShadowNumber({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min?: number | undefined;
  onChange: (value: number) => void;
}) {
  return (
    <label className="min-w-0">
      <span className="mb-1 block text-[9px] uppercase tracking-wide text-[var(--editor-text-soft)]">{label}</span>
      <TextInput
        controlSize="sm"
        aria-label={`Shadow ${label}`}
        type="number"
        min={min}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
