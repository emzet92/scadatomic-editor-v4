import type { ReactNode } from "react";
import { cx } from "./cx";

export type PanelCardVariant = "default" | "muted" | "accent" | "warning" | "danger";
export type PanelCardPadding = "none" | "sm" | "md" | "lg";

type SectionHeaderProps = {
  title: ReactNode;
  description?: ReactNode | undefined;
  action?: ReactNode | undefined;
  className?: string | undefined;
};

export function SectionHeader({
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cx("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">
          {title}
        </div>
        {description ? (
          <div className="mt-1 text-[10px] leading-4 text-[var(--editor-text-soft)]">
            {description}
          </div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type PanelCardProps = {
  children: ReactNode;
  className?: string | undefined;
  accent?: boolean | undefined;
  variant?: PanelCardVariant | undefined;
  padding?: PanelCardPadding | undefined;
};

const panelVariantClassNames: Record<PanelCardVariant, string> = {
  default: "border-[var(--editor-border)] bg-[var(--editor-surface)]",
  muted: "border-[var(--editor-border)] bg-[var(--editor-surface-muted)]",
  accent: "border-[var(--editor-accent-border)] bg-[var(--editor-accent-soft)]",
  warning: "border-amber-200 bg-amber-50",
  danger: "border-red-200 bg-red-50",
};

const panelPaddingClassNames: Record<PanelCardPadding, string> = {
  none: "p-0",
  sm: "p-2.5",
  md: "p-3",
  lg: "p-4",
};

export function PanelCard({
  children,
  className,
  accent = false,
  variant = "default",
  padding = "md",
}: PanelCardProps) {
  const resolvedVariant = accent ? "accent" : variant;

  return (
    <div
      className={cx(
        "rounded-lg border",
        panelVariantClassNames[resolvedVariant],
        panelPaddingClassNames[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

export function PanelSection({
  children,
  className,
  divided = false,
}: {
  children: ReactNode;
  className?: string | undefined;
  divided?: boolean | undefined;
}) {
  return (
    <section
      className={cx(
        "space-y-3",
        divided && "border-t border-[var(--editor-border)] pt-5",
        className
      )}
    >
      {children}
    </section>
  );
}

type EmptyActionProps = {
  children: ReactNode;
  onClick: () => void;
  className?: string | undefined;
};

export function EmptyAction({ children, onClick, className }: EmptyActionProps) {
  return (
    <button
      data-editor-ignore
      type="button"
      onClick={onClick}
      className={cx(
        "flex w-full items-center gap-2 rounded-lg border border-dashed border-[var(--editor-border)] px-3 py-3 text-left text-xs text-[var(--editor-text-muted)] transition hover:border-[var(--editor-accent-border)] hover:bg-[var(--editor-accent-soft)] hover:text-[var(--editor-accent)]",
        className
      )}
    >
      {children}
    </button>
  );
}
