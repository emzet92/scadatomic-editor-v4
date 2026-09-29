import { LayoutGrid } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide LayoutGrid glyph. */
export function GridIcon(props: IconProps) {
  return <LayoutGrid {...getIconProps(props)} />;
}
