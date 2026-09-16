import { Boxes, MousePointer2 } from "lucide-react";
import type { UiDocument } from "../../core/document";
import { validateReusableComponentSelection } from "../../reusable-components";
import { Button, Callout, PanelCard } from "../ui";

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
    <div data-editor-ignore className="flex h-full flex-col">
      <div className="border-b border-[var(--editor-border)] bg-[var(--editor-surface)] px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
            <MousePointer2 size={16} />
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--editor-text)]">
              {selectedNodeIds.length} components selected
            </div>
            <div className="mt-0.5 text-[10px] text-[var(--editor-text-muted)]">
              Ctrl/Cmd or Shift + click to change the selection.
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <PanelCard variant="accent" padding="lg" className="border-violet-200 bg-violet-50/50">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <Boxes size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-violet-900">Create reusable component</div>
              <div className="mt-1 text-[10px] leading-4 text-violet-700/80">
                The selection becomes one encapsulated component with a private Container root.
              </div>

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
                <Boxes size={13} /> Create component
              </Button>
            </div>
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
