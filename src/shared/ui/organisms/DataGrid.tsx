import type { HTMLAttributes, ReactNode } from "react";
import { Box } from "../atoms/Layout";
import { Surface } from "../atoms/Surface";
import { cx } from "../utils/cx";

export type DataGridProps = {
  children: ReactNode;
  className?: string | undefined;
};

export function DataGrid({ children, className }: DataGridProps) {
  return (
    <Surface radius="xl" padding="none" shadow="sm" className={cx("overflow-hidden", className)}>
      {children}
    </Surface>
  );
}

type DataGridLineProps = HTMLAttributes<HTMLDivElement> & {
  columns: string;
};

export function DataGridHeader({ columns, className, ...props }: DataGridLineProps) {
  return (
    <Box
      className={cx(
        "grid border-b border-[var(--editor-border)] bg-[var(--editor-surface-muted)] px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]",
        columns,
        className
      )}
      {...props}
    />
  );
}

export function DataGridRow({ columns, className, ...props }: DataGridLineProps) {
  return (
    <Box
      className={cx(
        "grid items-center border-b border-[var(--editor-border)] px-4 py-3 text-xs text-[var(--editor-text)] last:border-b-0",
        columns,
        className
      )}
      {...props}
    />
  );
}
