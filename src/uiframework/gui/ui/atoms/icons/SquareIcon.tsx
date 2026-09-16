import { Square } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Square glyph. */
export function SquareIcon(props: IconProps) {
  return <Square {...getIconProps(props)} />;
}
