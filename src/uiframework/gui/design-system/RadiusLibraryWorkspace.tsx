import { useMemo } from "react";
import { countRadiusTokenUsages } from "../../design-system/document-radius";
import { useEditorStore } from "../../editor-store";
import {
  AddIcon,
  Box,
  Button,
  Callout,
  DeleteIcon,
  EmptyState,
  IconButton,
  PageContainer,
  PageHeader,
  PanelCard,
  RadiusIcon,
  TextInput
} from "../ui";

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
    <PageContainer>
      <PageHeader
        icon={<RadiusIcon size={14} />}
        title="Radius"
        description="Define a shared corner-radius scale for buttons, containers, modals, images and other surfaces. Components reference stable token IDs, so renaming a radius step is safe."
        actions={
          <Button size="sm" variant="primary" onClick={() => addRadiusToken()}>
            <AddIcon size={14} /> Add radius
          </Button>
        }
      />

      {tokens.length === 0 ? (
        <EmptyState
          icon={<RadiusIcon size={20} />}
          title="No radius tokens yet"
          description="Create individual values or seed a practical 0 / 2 / 4 / 8 / 12 / 16 / 24 / pill scale."
          actions={
            <>
              <Button size="sm" variant="primary" onClick={() => addRadiusToken()}>
                <AddIcon size={14} /> Add radius
              </Button>
              <Button size="sm" variant="secondary" onClick={addStarterRadiusScale}>
                Create starter scale
              </Button>
            </>
          }
        />
      ) : (
        <Box className="space-y-3">
          {tokens.map((token) => {
            const usageCount = countRadiusTokenUsages(document, token.id);
            const previewRadius = Math.min(30, token.value);
            return (
              <PanelCard
                key={token.id}
                padding="lg"
                className="grid grid-cols-[minmax(210px,1fr)_minmax(240px,1.3fr)_130px_48px] items-center gap-4 rounded-2xl shadow-sm"
              >
                <Box className="space-y-2">
                  <TextInput
                    aria-label="Radius token name"
                    value={token.name}
                    onChange={(event) => updateRadiusToken(token.id, { name: event.target.value })}
                  />
                  <Box className="text-[10px] text-[var(--editor-text-soft)]">
                    {usageCount === 0 ? "Unused" : `${usageCount} ${usageCount === 1 ? "use" : "uses"}`}
                  </Box>
                </Box>

                <Box className="flex min-h-16 items-center gap-4 rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] px-4">
                  <Box
                    className="h-10 w-16 border-2 border-[var(--editor-accent)] bg-[var(--editor-accent-soft)]"
                    style={{ borderRadius: `${previewRadius}px` }}
                  />
                  <Box>
                    <Box className="text-xs font-medium text-[var(--editor-text)]">{token.value}px</Box>
                    <Box className="mt-0.5 text-[10px] text-[var(--editor-text-muted)]">
                      {token.value >= 999 ? "Pill / fully rounded" : "Corner radius preview"}
                    </Box>
                  </Box>
                </Box>

                <Box className="flex items-center gap-2">
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
                </Box>

                <IconButton
                  aria-label="Delete radius token and detach usages"
                  variant="danger"
                  size="icon"
                  onClick={() => deleteRadiusToken(token.id)}
                >
                  <DeleteIcon size={14} />
                </IconButton>
              </PanelCard>
            );
          })}
        </Box>
      )}

      <Callout className="mt-5">
        Deleting a radius token detaches every reference to its current numeric value, preserving the visual shape instead of leaving broken references.
      </Callout>
    </PageContainer>
  );
}
