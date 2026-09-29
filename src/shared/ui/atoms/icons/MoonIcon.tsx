import { Moon } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Moon glyph. */
export function MoonIcon(props: IconProps) {
  return <Moon {...getIconProps(props)} />;
}
