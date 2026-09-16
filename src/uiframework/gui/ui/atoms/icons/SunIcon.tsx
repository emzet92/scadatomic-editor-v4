import { Sun } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Sun glyph. */
export function SunIcon(props: IconProps) {
  return <Sun {...getIconProps(props)} />;
}
