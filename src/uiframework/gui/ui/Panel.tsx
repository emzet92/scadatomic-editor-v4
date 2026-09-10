import type { ReactNode } from "react";
import { cx } from "./cx";

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
};

export function PanelCard({ children, className, accent = false }: PanelCardProps) {
  return (
    <div
      className={cx(
        "rounded-lg border p-3",
        accent
          ? "border-[var(--editor-accent-border)] bg-[var(--editor-accent-soft)]"
          : "border-[var(--editor-border)] bg-[var(--editor-surface)]",
        className
      )}
    >
      {children}
    </div>
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
