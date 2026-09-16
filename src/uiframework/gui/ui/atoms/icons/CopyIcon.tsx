import { Copy } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Copy glyph. */
export function CopyIcon(props: IconProps) {
  return <Copy {...getIconProps(props)} />;
}
