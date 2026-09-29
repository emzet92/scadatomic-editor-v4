import { Layers } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Layers glyph. */
export function LayersIcon(props: IconProps) {
  return <Layers {...getIconProps(props)} />;
}
