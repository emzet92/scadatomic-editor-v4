import { Tablet } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Tablet glyph. */
export function TabletIcon(props: IconProps) {
  return <Tablet {...getIconProps(props)} />;
}
