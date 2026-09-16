import { Layers, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { countShadowTokenUsages } from "../../design-system/document-shadows";
import { shadowStyleToCss } from "../../design-system/shadows";
import { useEditorStore } from "../../editor-store";
import {
  Button,
  Callout,
  ColorPickerInput,
  EmptyState,
  FormField,
  IconButton,
  PageContainer,
  PageHeader,
  PanelCard,
  TextInput,
} from "../ui";

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
    <PageContainer size="xl">
      <PageHeader
        icon={<Layers size={14} />}
        title="Shadows / Elevation"
        description="Define structural elevation tokens with X/Y offset, blur, spread and color. Components keep stable token references while renderers receive the final shadow value."
        actions={
          <Button size="sm" variant="primary" onClick={() => addShadowToken()}>
            <Plus size={14} /> Add shadow
          </Button>
        }
      />

      {tokens.length === 0 ? (
        <EmptyState
          icon={<Layers size={20} />}
          title="No shadow tokens yet"
          description="Create individual shadows or seed a practical Elevation/None through Elevation/4 scale."
          actions={
            <>
              <Button size="sm" variant="primary" onClick={() => addShadowToken()}>
                <Plus size={14} /> Add shadow
              </Button>
              <Button size="sm" variant="secondary" onClick={addStarterShadowScale}>
                Create elevation scale
              </Button>
            </>
          }
        />
      ) : (
        <div className="space-y-3">
          {tokens.map((token) => {
            const usageCount = countShadowTokenUsages(document, token.id);
            return (
              <PanelCard
                key={token.id}
                padding="lg"
                className="grid grid-cols-[minmax(190px,.9fr)_minmax(230px,1.1fr)_minmax(380px,1.8fr)_44px] items-center gap-4 rounded-2xl shadow-sm"
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

                <IconButton
                  aria-label="Delete shadow token and detach usages"
                  variant="danger"
                  size="icon"
                  onClick={() => deleteShadowToken(token.id)}
                >
                  <Trash2 size={14} />
                </IconButton>
              </PanelCard>
            );
          })}
        </div>
      )}

      <Callout className="mt-5">
        Deleting a shadow token detaches each reference to a local structured shadow with the same X/Y/blur/spread/color values, preserving the rendered elevation.
      </Callout>
    </PageContainer>
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
    <FormField label={label} compact>
      <TextInput
        controlSize="sm"
        aria-label={`Shadow ${label}`}
        type="number"
        min={min}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </FormField>
  );
}
