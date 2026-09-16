import { Hand } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Hand glyph. */
export function HandIcon(props: IconProps) {
  return <Hand {...getIconProps(props)} />;
}
