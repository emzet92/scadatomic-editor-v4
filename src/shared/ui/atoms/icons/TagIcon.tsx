import { Tag } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Tag glyph. */
export function TagIcon(props: IconProps) {
  return <Tag {...getIconProps(props)} />;
}
