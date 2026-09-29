import { Cable } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Cable glyph. */
export function CableIcon(props: IconProps) {
  return <Cable {...getIconProps(props)} />;
}
