import { Radius } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Radius glyph. */
export function RadiusIcon(props: IconProps) {
  return <Radius {...getIconProps(props)} />;
}
