import type { UiDocument } from "../../core/document";
import { validateReusableComponentSelection } from "../../reusable-components";
import {
  Box,
  BoxesIcon,
  Button,
  Callout,
  PanelCard,
  PointerIcon
} from "../ui";

export function MultiSelectionPanel({
  document,
  selectedNodeIds,
  onCreateComponent,
}: {
  document: UiDocument;
  selectedNodeIds: string[];
  onCreateComponent: () => void;
}) {
  const validation = validateReusableComponentSelection(document, selectedNodeIds);

  return (
    <Box data-editor-ignore className="flex h-full flex-col">
      <Box className="border-b border-[var(--editor-border)] bg-[var(--editor-surface)] px-4 py-4">
        <Box className="flex items-start gap-3">
          <Box className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
            <PointerIcon size={16} />
          </Box>
          <Box>
            <Box className="text-sm font-semibold text-[var(--editor-text)]">
              {selectedNodeIds.length} components selected
            </Box>
            <Box className="mt-0.5 text-[10px] text-[var(--editor-text-muted)]">
              Ctrl/Cmd or Shift + click to change the selection.
            </Box>
          </Box>
        </Box>
      </Box>

      <Box className="flex-1 overflow-auto p-4">
        <PanelCard variant="accent" padding="lg" className="border-violet-200 bg-violet-50/50">
          <Box className="flex items-start gap-3">
            <Box className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <BoxesIcon size={15} />
            </Box>
            <Box className="min-w-0 flex-1">
              <Box className="text-xs font-semibold text-violet-900">Create reusable component</Box>
              <Box className="mt-1 text-[10px] leading-4 text-violet-700/80">
                The selection becomes one encapsulated component with a private Container root.
              </Box>

              {!validation.ok ? (
                <Callout variant="warning" size="sm" className="mt-3">
                  {validation.error}
                </Callout>
              ) : null}

              <Button
                variant="primary"
                size="sm"
                disabled={!validation.ok}
                onClick={onCreateComponent}
                className="mt-3"
              >
                <BoxesIcon size={13} /> Create component
              </Button>
            </Box>
          </Box>
        </PanelCard>
      </Box>
    </Box>
  );
}
