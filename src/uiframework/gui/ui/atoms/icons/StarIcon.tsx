import { Star } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Star glyph. */
export function StarIcon(props: IconProps) {
  return <Star {...getIconProps(props)} />;
}
