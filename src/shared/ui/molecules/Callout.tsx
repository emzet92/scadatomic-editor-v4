import type { ReactNode } from "react";
import { Box, Inline } from "../atoms/Layout";
import { cx } from "../utils/cx";

export type CalloutVariant = "muted" | "accent" | "warning" | "danger" | "success";
export type CalloutSize = "sm" | "md";

const variantClassNames: Record<CalloutVariant, string> = {
  muted: "border-[var(--editor-border)] bg-[var(--editor-surface-muted)] text-[var(--editor-text-muted)]",
  accent: "border-[var(--editor-accent-border)] bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const sizeClassNames: Record<CalloutSize, string> = {
  sm: "rounded-lg px-2.5 py-2 text-[10px] leading-4",
  md: "rounded-xl p-4 text-xs leading-5",
};

export type CalloutProps = {
  children: ReactNode;
  icon?: ReactNode | undefined;
  variant?: CalloutVariant | undefined;
  size?: CalloutSize | undefined;
  dashed?: boolean | undefined;
  className?: string | undefined;
};

export function Callout({
  children,
  icon,
  variant = "muted",
  size = "md",
  dashed = false,
  className,
}: CalloutProps) {
  const classes = cx(
    "border",
    dashed && "border-dashed",
    variantClassNames[variant],
    sizeClassNames[size],
    className
  );

  if (!icon) return <Box className={classes}>{children}</Box>;

  return (
    <Inline align="start" gap="sm" className={classes}>
      <Box className="mt-0.5 shrink-0">{icon}</Box>
      <Box className="min-w-0">{children}</Box>
    </Inline>
  );
}
