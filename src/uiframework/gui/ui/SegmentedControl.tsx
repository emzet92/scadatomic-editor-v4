import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

export type SegmentedControlVariant = "outline" | "soft";

type SegmentedControlProps = {
  children: ReactNode;
  className?: string | undefined;
  variant?: SegmentedControlVariant | undefined;
  fullWidth?: boolean | undefined;
};

export function SegmentedControl({
  children,
  className,
  variant = "outline",
  fullWidth = false,
}: SegmentedControlProps) {
  return (
    <div
      data-editor-ignore
      className={cx(
        "inline-flex h-9 overflow-hidden",
        variant === "outline"
          ? "rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface)]"
          : "rounded-[16px] bg-[var(--editor-surface-muted)] p-1",
        fullWidth && "flex w-full",
        className
      )}
    >
      {children}
    </div>
  );
}

type SegmentedControlItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean | undefined;
  variant?: SegmentedControlVariant | undefined;
  grow?: boolean | undefined;
};

export function SegmentedControlItem({
  active = false,
  variant = "outline",
  grow = false,
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
        "inline-flex h-full min-w-10 items-center justify-center px-2 transition focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--editor-accent-soft)]",
        grow && "flex-1",
        variant === "outline"
          ? "border-r border-[var(--editor-border)] text-sm last:border-r-0"
          : "rounded-[12px] border-0 text-[11px] font-semibold",
        active
          ? variant === "outline"
            ? "bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]"
            : "bg-[var(--editor-surface)] text-[var(--editor-text)] shadow-[0_1px_3px_rgba(15,23,42,0.08)]"
          : "text-[var(--editor-text-muted)] hover:text-[var(--editor-text)]",
        variant === "outline" && !active && "hover:bg-[var(--editor-accent-soft)]",
        className
      )}
      {...props}
    />
  );
}
