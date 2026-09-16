import { Copy, Palette, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { ColorToken } from "../../design-system/colors";
import { countColorTokenUsages } from "../../design-system/document-colors";
import { useEditorStore } from "../../editor-store";
import {
  Button,
  Callout,
  ColorPickerInput,
  DataGrid,
  DataGridHeader,
  DataGridRow,
  EmptyState,
  IconButton,
  PageContainer,
  PageHeader,
  TextInput,
  Box,
  Icon,
} from "../ui";

const COLOR_GRID = "grid-cols-[56px_minmax(180px,1.3fr)_minmax(160px,.8fr)_100px_84px]";

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
    <PageContainer>
      <PageHeader
        icon={<Icon glyph={Palette} size={14} />}
        title="Color library"
        description="Define named project colors once and reference them from component properties and variants. Rename safely; references use stable IDs."
        actions={
          <Button size="sm" variant="primary" onClick={() => addColorToken({ name: "Color", value: "#7c3aed" })}>
            <Icon glyph={Plus} size={14} /> Add color
          </Button>
        }
      />

      {colors.length === 0 ? (
        <EmptyState
          icon={<Icon glyph={Palette} size={20} />}
          title="No color tokens yet"
          description="Create a color or seed a starter palette for brand, surfaces, text and status colors."
          actions={
            <>
              <Button size="sm" variant="primary" onClick={() => addColorToken()}>
                <Icon glyph={Plus} size={14} /> Add color
              </Button>
              <Button size="sm" variant="secondary" onClick={addStarterColorPalette}>
                Create starter palette
              </Button>
            </>
          }
        />
      ) : (
        <DataGrid>
          <DataGridHeader columns={COLOR_GRID}>
            <span>Color</span>
            <span>Name</span>
            <span>Value</span>
            <span>Usage</span>
            <span className="text-right">Actions</span>
          </DataGridHeader>
          {colors.map((token) => {
            const usageCount = countColorTokenUsages(document, token.id);
            return (
              <DataGridRow key={token.id} columns={COLOR_GRID}>
                <Box className="flex items-center justify-center">
                  <ColorPickerInput
                    compact
                    ariaLabel={`Choose ${token.name}`}
                    value={token.value}
                    onChange={(value) => updateColorToken(token.id, { value })}
                    showValue={false}
                  />
                </Box>

                <TextInput
                  aria-label="Color token name"
                  value={token.name}
                  onChange={(event) => updateColorToken(token.id, { name: event.target.value })}
                />

                <TextInput
                  aria-label="Color value"
                  value={token.value}
                  onChange={(event) => updateColorToken(token.id, { value: event.target.value })}
                />

                <Box className="text-xs text-[var(--editor-text-muted)]">
                  {usageCount === 0 ? "Unused" : `${usageCount} ${usageCount === 1 ? "use" : "uses"}`}
                </Box>

                <Box className="flex items-center justify-end gap-1">
                  <IconButton
                    aria-label={copiedId === token.id ? "Copied" : "Copy value"}
                    size="icon"
                    onClick={() => void copyToken(token)}
                  >
                    <Icon glyph={Copy} size={14} />
                  </IconButton>
                  <IconButton
                    aria-label="Delete token and detach usages"
                    variant="danger"
                    size="icon"
                    onClick={() => deleteColorToken(token.id)}
                  >
                    <Icon glyph={Trash2} size={14} />
                  </IconButton>
                </Box>
              </DataGridRow>
            );
          })}
        </DataGrid>
      )}

      <Callout className="mt-5">
        Deleting a token detaches every reference to its current literal value. The UI keeps the same appearance instead of leaving broken references.
      </Callout>
    </PageContainer>
  );
}
