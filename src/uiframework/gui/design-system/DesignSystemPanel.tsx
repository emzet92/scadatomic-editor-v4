import type { ReactNode } from "react";
import { Palette, Type } from "lucide-react";
import { useEditorStore } from "../../editor-store";
import { SectionHeader } from "../ui";

export type DesignSystemSection = "colors" | "typography";

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
      <div className="rounded-xl border border-dashed border-[var(--editor-border)] p-3 text-xs leading-5 text-[var(--editor-text-muted)]">
        Spacing, radii, shadows and motion can use the same token reference model next.
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
