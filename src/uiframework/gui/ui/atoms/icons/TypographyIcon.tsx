import { Type } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Type glyph. */
export function TypographyIcon(props: IconProps) {
  return <Type {...getIconProps(props)} />;
}
