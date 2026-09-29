import { Layers3 } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Layers3 glyph. */
export function LayerStackIcon(props: IconProps) {
  return <Layers3 {...getIconProps(props)} />;
}
