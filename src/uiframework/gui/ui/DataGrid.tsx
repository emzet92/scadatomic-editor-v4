import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

export function DataGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={cx("overflow-hidden rounded-2xl border border-[var(--editor-border)] bg-[var(--editor-surface)] shadow-sm", className)}>
      {children}
    </div>
  );
}

type DataGridLineProps = HTMLAttributes<HTMLDivElement> & {
  columns: string;
  children: ReactNode;
};

export function DataGridHeader({ columns, children, className, ...props }: DataGridLineProps) {
  return (
    <div
      className={cx(
        "grid items-center gap-3 border-b border-[var(--editor-border)] bg-[var(--editor-surface-muted)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]",
        columns,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DataGridRow({ columns, children, className, ...props }: DataGridLineProps) {
  return (
    <div
      className={cx(
        "grid items-center gap-3 border-b border-[var(--editor-border)] px-4 py-3 last:border-b-0",
        columns,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
