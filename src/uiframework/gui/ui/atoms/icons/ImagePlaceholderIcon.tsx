import { ImageIcon } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide ImageIcon glyph. */
export function ImagePlaceholderIcon(props: IconProps) {
  return <ImageIcon {...getIconProps(props)} />;
}
