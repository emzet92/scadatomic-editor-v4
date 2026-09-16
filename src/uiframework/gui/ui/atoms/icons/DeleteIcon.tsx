import { Trash2 } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Trash2 glyph. */
export function DeleteIcon(props: IconProps) {
  return <Trash2 {...getIconProps(props)} />;
}
