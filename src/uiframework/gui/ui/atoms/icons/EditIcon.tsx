import { Pencil } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Pencil glyph. */
export function EditIcon(props: IconProps) {
  return <Pencil {...getIconProps(props)} />;
}
