import type { ReactNode } from "react";
import { Layers, MoveHorizontal, Palette, Radius, Type } from "lucide-react";
import { useEditorStore } from "../../editor-store";
import { SectionHeader } from "../ui";

export type DesignSystemSection = "colors" | "typography" | "spacing" | "radius" | "shadows";

export function DesignSystemPanel({
  activeSection,
  onSelectSection,
}: {
  activeSection: DesignSystemSection;
  onSelectSection: (section: DesignSystemSection) => void;
}) {
  const colorCount = useEditorStore(
    (state) => Object.keys(state.document.designSystem?.colors ?? {}).length
  );
  const typographyCount = useEditorStore(
    (state) => Object.keys(state.document.designSystem?.typography ?? {}).length
  );
  const spacingCount = useEditorStore(
    (state) => Object.keys(state.document.designSystem?.spacing ?? {}).length
  );
  const radiusCount = useEditorStore(
    (state) => Object.keys(state.document.designSystem?.radius ?? {}).length
  );
  const shadowCount = useEditorStore(
    (state) => Object.keys(state.document.designSystem?.shadows ?? {}).length
  );

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Design System"
        description="Project-local tokens shared by every page and reusable component."
      />
      <TokenSectionButton
        active={activeSection === "colors"}
        icon={<Palette size={15} />}
        title="Colors"
        count={colorCount}
        onClick={() => onSelectSection("colors")}
      />
      <TokenSectionButton
        active={activeSection === "typography"}
        icon={<Type size={15} />}
        title="Typography"
        count={typographyCount}
        onClick={() => onSelectSection("typography")}
      />
      <TokenSectionButton
        active={activeSection === "spacing"}
        icon={<MoveHorizontal size={15} />}
        title="Spacing"
        count={spacingCount}
        onClick={() => onSelectSection("spacing")}
      />
      <TokenSectionButton
        active={activeSection === "radius"}
        icon={<Radius size={15} />}
        title="Radius"
        count={radiusCount}
        onClick={() => onSelectSection("radius")}
      />
      <TokenSectionButton
        active={activeSection === "shadows"}
        icon={<Layers size={15} />}
        title="Shadows / Elevation"
        count={shadowCount}
        onClick={() => onSelectSection("shadows")}
      />
      <div className="rounded-xl border border-dashed border-[var(--editor-border)] p-3 text-xs leading-5 text-[var(--editor-text-muted)]">
        Borders, opacity and motion can use the same token reference model next.
      </div>
    </div>
  );
}

function TokenSectionButton({
  active,
  icon,
  title,
  count,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  title: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border p-3 text-left transition ${
        active
          ? "border-[var(--editor-accent-border)] bg-[var(--editor-accent-soft)]"
          : "border-[var(--editor-border)] bg-[var(--editor-surface)] hover:bg-[var(--editor-surface-muted)]"
      }`}
    >
      <div className={`flex items-center gap-2 text-sm font-medium ${active ? "text-[var(--editor-accent)]" : "text-[var(--editor-text)]"}`}>
        {icon} {title}
      </div>
      <div className="mt-1 text-xs text-[var(--editor-text-muted)]">
        {count} {count === 1 ? "token" : "tokens"}
      </div>
    </button>
  );
}
