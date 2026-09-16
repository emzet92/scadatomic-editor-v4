import { Maximize2 } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Maximize2 glyph. */
export function MaximizeIcon(props: IconProps) {
  return <Maximize2 {...getIconProps(props)} />;
}
