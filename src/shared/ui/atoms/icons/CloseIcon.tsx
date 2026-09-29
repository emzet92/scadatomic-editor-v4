import { X } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide X glyph. */
export function CloseIcon(props: IconProps) {
  return <X {...getIconProps(props)} />;
}
