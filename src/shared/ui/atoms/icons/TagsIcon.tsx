import { Tags } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Tags glyph. */
export function TagsIcon(props: IconProps) {
  return <Tags {...getIconProps(props)} />;
}
