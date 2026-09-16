import { MoveHorizontal, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { countSpacingTokenUsages } from "../../design-system/document-spacing";
import { useEditorStore } from "../../editor-store";
import {
  Button,
  Callout,
  EmptyState,
  IconButton,
  PageContainer,
  PageHeader,
  PanelCard,
  TextInput,
} from "../ui";

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
    <PageContainer>
      <PageHeader
        icon={<MoveHorizontal size={14} />}
        title="Spacing"
        description="Define a shared spacing scale for padding, gaps and margins. Components reference stable token IDs, so renaming a spacing step is safe."
        actions={
          <Button size="sm" variant="primary" onClick={() => addSpacingToken()}>
            <Plus size={14} /> Add spacing
          </Button>
        }
      />

      {tokens.length === 0 ? (
        <EmptyState
          icon={<MoveHorizontal size={20} />}
          title="No spacing tokens yet"
          description="Create individual values or seed a practical 2 / 4 / 8 / 16 / 24 / 32 / 48 px scale."
          actions={
            <>
              <Button size="sm" variant="primary" onClick={() => addSpacingToken()}>
                <Plus size={14} /> Add spacing
              </Button>
              <Button size="sm" variant="secondary" onClick={addStarterSpacingScale}>
                Create starter scale
              </Button>
            </>
          }
        />
      ) : (
        <div className="space-y-3">
          {tokens.map((token) => {
            const usageCount = countSpacingTokenUsages(document, token.id);
            return (
              <PanelCard
                key={token.id}
                padding="lg"
                className="grid grid-cols-[minmax(210px,1fr)_minmax(240px,1.3fr)_130px_48px] items-center gap-4 rounded-2xl shadow-sm"
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
                  <span className="ml-3 text-xs text-[var(--editor-text-muted)]">{token.value}px</span>
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

                <IconButton
                  aria-label="Delete spacing token and detach usages"
                  variant="danger"
                  size="icon"
                  onClick={() => deleteSpacingToken(token.id)}
                >
                  <Trash2 size={14} />
                </IconButton>
              </PanelCard>
            );
          })}
        </div>
      )}

      <Callout className="mt-5">
        Deleting a spacing token detaches every reference to its current numeric value, preserving the layout instead of leaving broken references.
      </Callout>
    </PageContainer>
  );
}
