import { Braces } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Braces glyph. */
export function BracesIcon(props: IconProps) {
  return <Braces {...getIconProps(props)} />;
}
