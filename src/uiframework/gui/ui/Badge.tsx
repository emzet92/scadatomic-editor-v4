import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

export type BadgeVariant = "neutral" | "accent" | "success" | "warning" | "danger";
export type BadgeSize = "xs" | "sm";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant | undefined;
  size?: BadgeSize | undefined;
  icon?: ReactNode | undefined;
};

const variantClassNames: Record<BadgeVariant, string> = {
  neutral: "bg-[var(--editor-surface-muted)] text-[var(--editor-text-muted)]",
  accent: "bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
};

const sizeClassNames: Record<BadgeSize, string> = {
  xs: "min-h-5 px-1.5 text-[9px]",
  sm: "min-h-6 px-2 text-[10px]",
};

export function Badge({
  variant = "neutral",
  size = "xs",
  icon,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center gap-1 rounded-md font-semibold uppercase tracking-wide",
        variantClassNames[variant],
        sizeClassNames[size],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}
