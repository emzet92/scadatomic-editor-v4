import { Play } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Play glyph. */
export function PlayIcon(props: IconProps) {
  return <Play {...getIconProps(props)} />;
}
