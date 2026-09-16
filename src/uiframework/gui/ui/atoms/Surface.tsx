import type { HTMLAttributes } from "react";
import { cx } from "../utils/cx";

export type SurfaceVariant = "default" | "muted" | "accent" | "success" | "warning" | "danger" | "canvas" | "transparent";
export type SurfaceBorder = "none" | "default" | "strong" | "accent";
export type SurfaceRadius = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
export type SurfacePadding = "none" | "xs" | "sm" | "md" | "lg";

const variantClassNames: Record<SurfaceVariant, string> = {
  default: "bg-[var(--editor-surface)]",
  muted: "bg-[var(--editor-surface-muted)]",
  accent: "bg-[var(--editor-accent-soft)]",
  success: "bg-emerald-50",
  warning: "bg-amber-50",
  danger: "bg-red-50",
  canvas: "bg-[var(--editor-canvas-bg)]",
  transparent: "bg-transparent",
};

const borderClassNames: Record<SurfaceBorder, string> = {
  none: "border-0",
  default: "border border-[var(--editor-border)]",
  strong: "border border-[var(--editor-border-strong)]",
  accent: "border border-[var(--editor-accent-border)]",
};

const radiusClassNames: Record<SurfaceRadius, string> = {
  none: "rounded-none",
  sm: "rounded-md",
  md: "rounded-lg",
  lg: "rounded-xl",
  xl: "rounded-2xl",
  "2xl": "rounded-[20px]",
  full: "rounded-full",
};

const paddingClassNames: Record<SurfacePadding, string> = {
  none: "p-0",
  xs: "p-2",
  sm: "p-2.5",
  md: "p-3",
  lg: "p-4",
};

export type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  variant?: SurfaceVariant | undefined;
  border?: SurfaceBorder | undefined;
  radius?: SurfaceRadius | undefined;
  padding?: SurfacePadding | undefined;
  shadow?: "none" | "sm" | "md" | undefined;
};

export function Surface({
  variant = "default",
  border = "default",
  radius = "md",
  padding = "md",
  shadow = "none",
  className,
  ...props
}: SurfaceProps) {
  return (
    <div
      className={cx(
        variantClassNames[variant],
        borderClassNames[border],
        radiusClassNames[radius],
        paddingClassNames[padding],
        shadow === "sm" && "shadow-sm",
        shadow === "md" && "shadow-[0_12px_32px_rgba(15,23,42,0.14)]",
        className
      )}
      {...props}
    />
  );
}
