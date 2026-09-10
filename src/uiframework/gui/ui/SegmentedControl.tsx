import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

type SegmentedControlProps = {
  children: ReactNode;
  className?: string | undefined;
};

export function SegmentedControl({
  children,
  className,
}: SegmentedControlProps) {
  return (
    <div
      data-editor-ignore
      className={cx(
        "inline-flex h-9 overflow-hidden rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface)]",
        className
      )}
    >
      {children}
    </div>
  );
}

type SegmentedControlItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean | undefined;
};

export function SegmentedControlItem({
  active = false,
  className,
  type = "button",
  ...props
}: SegmentedControlItemProps) {
  return (
    <button
      data-editor-ignore
      type={type}
      aria-pressed={active}
      className={cx(
        "inline-flex h-full min-w-10 items-center justify-center border-r border-[var(--editor-border)] px-2 text-sm transition last:border-r-0 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--editor-accent-soft)]",
        active
          ? "bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]"
          : "text-[var(--editor-text-muted)] hover:bg-[var(--editor-accent-soft)] hover:text-[var(--editor-text)]",
        className
      )}
      {...props}
    />
  );
}
