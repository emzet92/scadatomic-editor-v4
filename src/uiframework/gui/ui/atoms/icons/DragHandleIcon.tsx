import { GripVertical } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide GripVertical glyph. */
export function DragHandleIcon(props: IconProps) {
  return <GripVertical {...getIconProps(props)} />;
}
