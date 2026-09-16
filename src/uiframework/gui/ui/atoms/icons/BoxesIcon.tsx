import { Boxes } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Boxes glyph. */
export function BoxesIcon(props: IconProps) {
  return <Boxes {...getIconProps(props)} />;
}
