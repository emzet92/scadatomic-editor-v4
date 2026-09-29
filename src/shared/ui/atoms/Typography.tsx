import type { HTMLAttributes } from "react";
import { cx } from "../utils/cx";

export type TextTone = "default" | "muted" | "soft" | "accent" | "success" | "warning" | "danger" | "inherit";
export type TextVariant = "body" | "body-sm" | "label" | "caption" | "metadata" | "eyebrow" | "code";
export type TextElement = "span" | "p" | "div" | "label" | "code";

const textVariantClassNames: Record<TextVariant, string> = {
  body: "text-sm leading-6",
  "body-sm": "text-xs leading-5",
  label: "text-xs font-medium",
  caption: "text-[11px] leading-4",
  metadata: "text-[10px] leading-4",
  eyebrow: "text-[10px] font-semibold uppercase tracking-wide",
  code: "font-mono text-xs",
};

const toneClassNames: Record<TextTone, string> = {
  default: "text-[var(--editor-text)]",
  muted: "text-[var(--editor-text-muted)]",
  soft: "text-[var(--editor-text-soft)]",
  accent: "text-[var(--editor-accent)]",
  success: "text-[var(--editor-success)]",
  warning: "text-amber-700",
  danger: "text-[var(--editor-danger)]",
  inherit: "text-inherit",
};

export type TextProps = HTMLAttributes<HTMLElement> & {
  as?: TextElement | undefined;
  variant?: TextVariant | undefined;
  tone?: TextTone | undefined;
  truncate?: boolean | undefined;
};

export function Text({
  as: Component = "span",
  variant = "body-sm",
  tone = "default",
  truncate = false,
  className,
  ...props
}: TextProps) {
  return (
    <Component
      className={cx(textVariantClassNames[variant], toneClassNames[tone], truncate && "truncate", className)}
      {...props}
    />
  );
}

export type HeadingLevel = 1 | 2 | 3 | 4;
export type HeadingSize = "sm" | "md" | "lg" | "xl";

const headingSizeClassNames: Record<HeadingSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-2xl tracking-tight",
};

export type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  level?: HeadingLevel | undefined;
  size?: HeadingSize | undefined;
};

export function Heading({ level = 2, size = "md", className, ...props }: HeadingProps) {
  const Component = `h${level}` as "h1" | "h2" | "h3" | "h4";
  return (
    <Component
      className={cx("font-semibold text-[var(--editor-text)]", headingSizeClassNames[size], className)}
      {...props}
    />
  );
}
