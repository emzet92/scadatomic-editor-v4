import { SunMoon } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide SunMoon glyph. */
export function ThemeIcon(props: IconProps) {
  return <SunMoon {...getIconProps(props)} />;
}
