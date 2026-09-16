import type { ComponentType, CSSProperties, SVGProps } from "react";
import {
  editorIconSizes,
  editorIconStrokeWidths,
  editorIconTones,
  type EditorIconSize,
  type EditorIconTone,
  type EditorIconWeight,
} from "../../tokens";
import { cx } from "../../utils/cx";

export type IconSize = EditorIconSize;
export type IconWeight = EditorIconWeight;
export type IconTone = EditorIconTone;

export type IconProps = Omit<SVGProps<SVGSVGElement>, "strokeWidth"> & {
  size?: IconSize | number | undefined;
  tone?: IconTone | undefined;
  weight?: IconWeight | undefined;
  strokeWidth?: number | undefined;
  label?: string | undefined;
};

export type IconComponent = ComponentType<IconProps>;

/**
 * Resolves design-system icon tokens to SVG props.
 * Only named icon atoms should call this helper.
 */
export function getIconProps({
  size = "md",
  tone = "inherit",
  weight = "regular",
  strokeWidth,
  label,
  className,
  style,
  ...props
}: IconProps) {
  const resolvedSize = typeof size === "number" ? size : editorIconSizes[size];
  const resolvedStrokeWidth = strokeWidth ?? editorIconStrokeWidths[weight];
  const resolvedStyle: CSSProperties = {
    ...(tone === "inherit" ? undefined : { color: editorIconTones[tone] }),
    ...style,
  };

  return {
    ...props,
    size: resolvedSize,
    strokeWidth: resolvedStrokeWidth,
    "aria-hidden": label ? undefined : true,
    "aria-label": label,
    role: label ? "img" : undefined,
    className: cx("shrink-0", className),
    style: resolvedStyle,
  };
}
