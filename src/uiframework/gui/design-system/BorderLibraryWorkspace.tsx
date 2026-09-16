import { useMemo } from "react";
import { countBorderTokenUsages } from "../../design-system/document-borders";
import {
  borderStyleToCss,
  type BorderLineStyle,
} from "../../design-system/borders";
import { useEditorStore } from "../../editor-store";
import {
  AddIcon,
  Box,
  Button,
  Callout,
  ColorPickerInput,
  DeleteIcon,
  EmptyState,
  FormField,
  IconButton,
  PageContainer,
  PageHeader,
  PanelCard,
  Select,
  SquareIcon,
  TextInput
} from "../ui";

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
    <PageContainer size="xl">
      <PageHeader
        icon={<SquareIcon size={14} />}
        title="Borders / Stroke Styles"
        description="Define reusable structural strokes with width, line style and color. Components reference the token by stable ID while renderers receive a final border value."
        actions={
          <Button size="sm" variant="primary" onClick={() => addBorderToken()}>
            <AddIcon size={14} /> Add stroke
          </Button>
        }
      />

      {tokens.length === 0 ? (
        <EmptyState
          icon={<SquareIcon size={20} />}
          title="No border tokens yet"
          description="Create individual strokes or seed a practical Subtle / Default / Strong / Focus / Dashed starter set."
          actions={
            <>
              <Button size="sm" variant="primary" onClick={() => addBorderToken()}>
                <AddIcon size={14} /> Add stroke
              </Button>
              <Button size="sm" variant="secondary" onClick={addStarterBorderScale}>
                Create starter strokes
              </Button>
            </>
          }
        />
      ) : (
        <Box className="space-y-3">
          {tokens.map((token) => {
            const usageCount = countBorderTokenUsages(document, token.id);
            return (
              <PanelCard
                key={token.id}
                padding="lg"
                className="grid grid-cols-[minmax(190px,.9fr)_minmax(210px,1fr)_minmax(360px,1.7fr)_44px] items-center gap-4 rounded-2xl shadow-sm"
              >
                <Box className="space-y-2">
                  <TextInput
                    aria-label="Border token name"
                    value={token.name}
                    onChange={(event) => updateBorderToken(token.id, { name: event.target.value })}
                  />
                  <Box className="text-[10px] text-[var(--editor-text-soft)]">
                    {usageCount === 0 ? "Unused" : `${usageCount} ${usageCount === 1 ? "use" : "uses"}`}
                  </Box>
                </Box>

                <Box className="flex h-20 items-center justify-center rounded-xl border border-[var(--editor-border)] bg-[var(--editor-canvas-bg)]">
                  <Box
                    className="h-10 w-24 rounded-xl bg-[var(--editor-surface)]"
                    style={{ border: borderStyleToCss(token), boxSizing: "border-box" }}
                  />
                </Box>

                <Box className="space-y-2">
                  <Box className="grid grid-cols-[120px_minmax(140px,1fr)] gap-2">
                    <FormField label="Width" compact>
                      <TextInput
                        controlSize="sm"
                        aria-label={`${token.name} width`}
                        type="number"
                        min={0}
                        step={1}
                        value={token.width}
                        onChange={(event) => updateBorderToken(token.id, { width: Math.max(0, Number(event.target.value)) })}
                      />
                    </FormField>
                    <FormField label="Style" compact>
                      <Select
                        controlSize="sm"
                        aria-label={`${token.name} line style`}
                        value={token.style}
                        onChange={(event) => updateBorderToken(token.id, { style: event.target.value as BorderLineStyle })}
                      >
                        {BORDER_STYLES.map((style) => (
                          <option key={style} value={style}>{style}</option>
                        ))}
                      </Select>
                    </FormField>
                  </Box>
                  <ColorPickerInput
                    compact
                    ariaLabel={`${token.name} border color`}
                    value={token.color}
                    onChange={(color) => updateBorderToken(token.id, { color })}
                  />
                </Box>

                <IconButton
                  aria-label="Delete border token and detach usages"
                  variant="danger"
                  size="icon"
                  onClick={() => deleteBorderToken(token.id)}
                >
                  <DeleteIcon size={14} />
                </IconButton>
              </PanelCard>
            );
          })}
        </Box>
      )}

      <Callout className="mt-5">
        Deleting a border token detaches every reference to a local structured stroke with the same width, style and color, preserving the rendered appearance.
      </Callout>
    </PageContainer>
  );
}
