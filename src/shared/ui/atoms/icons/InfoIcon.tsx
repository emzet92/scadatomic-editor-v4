import { Info } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Info glyph. */
export function InfoIcon(props: IconProps) {
  return <Info {...getIconProps(props)} />;
}
