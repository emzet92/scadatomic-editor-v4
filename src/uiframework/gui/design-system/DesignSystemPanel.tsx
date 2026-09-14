import { Palette } from "lucide-react";
import { useEditorStore } from "../../editor-store";
import { SectionHeader } from "../ui";

export function DesignSystemPanel() {
  const colorCount = useEditorStore(
    (state) => Object.keys(state.document.designSystem?.colors ?? {}).length
  );

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Design System"
        description="Project-local tokens shared by every page and reusable component."
      />
      <div className="rounded-xl border border-[var(--editor-accent-border)] bg-[var(--editor-accent-soft)] p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--editor-accent)]">
          <Palette size={15} /> Colors
        </div>
        <div className="mt-1 text-xs text-[var(--editor-text-muted)]">
          {colorCount} {colorCount === 1 ? "token" : "tokens"}
        </div>
      </div>
      <div className="rounded-xl border border-dashed border-[var(--editor-border)] p-3 text-xs leading-5 text-[var(--editor-text-muted)]">
        Typography, spacing, radii and shadows can be added here later using the same token model.
      </div>
    </div>
  );
}
