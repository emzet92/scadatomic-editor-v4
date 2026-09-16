import type { LucideIcon, LucideProps } from "lucide-react";
import { cx } from "../utils/cx";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";
export type IconTone = "default" | "muted" | "soft" | "accent" | "success" | "danger" | "inherit";

const iconSizeValues: Record<IconSize, number> = {
  xs: 11,
  sm: 13,
  md: 16,
  lg: 20,
  xl: 24,
};

const toneClassNames: Record<IconTone, string> = {
  default: "text-[var(--editor-text)]",
  muted: "text-[var(--editor-text-muted)]",
  soft: "text-[var(--editor-text-soft)]",
  accent: "text-[var(--editor-accent)]",
  success: "text-[var(--editor-success)]",
  danger: "text-[var(--editor-danger)]",
  inherit: "text-inherit",
};

export type IconProps = Omit<LucideProps, "size"> & {
  glyph: LucideIcon;
  size?: IconSize | number | undefined;
  tone?: IconTone | undefined;
  label?: string | undefined;
};

export function Icon({
  glyph: Glyph,
  size = "md",
  tone = "inherit",
  label,
  className,
  ...props
}: IconProps) {
  const resolvedSize = typeof size === "number" ? size : iconSizeValues[size];
  return (
    <Glyph
      size={resolvedSize}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      className={cx("shrink-0", toneClassNames[tone], className)}
      {...props}
    />
  );
}
