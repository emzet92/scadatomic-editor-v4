import { Image } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Image glyph. */
export function ImageIcon(props: IconProps) {
  return <Image {...getIconProps(props)} />;
}
