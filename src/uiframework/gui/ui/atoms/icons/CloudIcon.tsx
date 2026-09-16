import { Cloud } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Cloud glyph. */
export function CloudIcon(props: IconProps) {
  return <Cloud {...getIconProps(props)} />;
}
