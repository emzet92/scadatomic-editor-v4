import type { ReactNode } from "react";
import { Center } from "../atoms/Layout";
import { cx } from "../utils/cx";

export type IconTileVariant = "neutral" | "accent" | "success" | "warning" | "danger";
export type IconTileSize = "sm" | "md" | "lg";

const variantClassNames: Record<IconTileVariant, string> = {
  neutral: "bg-[var(--editor-surface-muted)] text-[var(--editor-text-muted)]",
  accent: "bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-[var(--editor-danger)]",
};

const sizeClassNames: Record<IconTileSize, string> = {
  sm: "size-7 rounded-md",
  md: "size-9 rounded-lg",
  lg: "size-11 rounded-xl",
};

export function IconTile({
  children,
  variant = "accent",
  size = "md",
  className,
}: {
  children: ReactNode;
  variant?: IconTileVariant | undefined;
  size?: IconTileSize | undefined;
  className?: string | undefined;
}) {
  return <Center className={cx("shrink-0", variantClassNames[variant], sizeClassNames[size], className)}>{children}</Center>;
}
