import { Palette } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Palette glyph. */
export function PaletteIcon(props: IconProps) {
  return <Palette {...getIconProps(props)} />;
}
