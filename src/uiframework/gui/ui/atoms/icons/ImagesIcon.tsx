import { Images } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Images glyph. */
export function ImagesIcon(props: IconProps) {
  return <Images {...getIconProps(props)} />;
}
