import type { ReactNode } from "react";
import { PanelCard } from "./Panel";
import { cx } from "./cx";

export function EmptyState({
  icon,
  title,
  description,
  actions,
  compact = false,
  className,
}: {
  icon?: ReactNode | undefined;
  title: ReactNode;
  description?: ReactNode | undefined;
  actions?: ReactNode | undefined;
  compact?: boolean | undefined;
  className?: string | undefined;
}) {
  return (
    <PanelCard
      className={cx(
        "flex flex-col items-center justify-center text-center",
        compact ? "min-h-40" : "min-h-56",
        className
      )}
    >
      {icon ? (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]">
          {icon}
        </div>
      ) : null}
      <div className="text-sm font-semibold text-[var(--editor-text)]">{title}</div>
      {description ? (
        <div className="mt-1 max-w-md text-xs leading-5 text-[var(--editor-text-muted)]">
          {description}
        </div>
      ) : null}
      {actions ? <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{actions}</div> : null}
    </PanelCard>
  );
}
