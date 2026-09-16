import { Menu } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Menu glyph. */
export function MenuIcon(props: IconProps) {
  return <Menu {...getIconProps(props)} />;
}
