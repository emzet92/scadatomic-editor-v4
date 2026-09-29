import type { ReactNode } from "react";
import { Inline } from "../atoms/Layout";
import { cx } from "../utils/cx";

export type ToolbarProps = {
  start?: ReactNode | undefined;
  center?: ReactNode | undefined;
  end?: ReactNode | undefined;
  className?: string | undefined;
  compact?: boolean | undefined;
};

export function Toolbar({ start, center, end, className, compact = false }: ToolbarProps) {
  return (
    <Inline
      justify="between"
      gap="md"
      className={cx(
        "w-full border-b border-[var(--editor-border)] bg-[var(--editor-surface)]",
        compact ? "min-h-11 px-3 py-2" : "min-h-16 px-6 py-3",
        className
      )}
    >
      <Inline className="min-w-0 flex-1">{start}</Inline>
      {center ? <Inline justify="center" className="min-w-0 flex-1">{center}</Inline> : null}
      <Inline justify="end" className="min-w-0 flex-1">{end}</Inline>
    </Inline>
  );
}
