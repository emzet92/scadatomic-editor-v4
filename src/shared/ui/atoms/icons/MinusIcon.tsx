import { Minus } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Minus glyph. */
export function MinusIcon(props: IconProps) {
  return <Minus {...getIconProps(props)} />;
}
