import { MoveVertical } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide MoveVertical glyph. */
export function VerticalResizeIcon(props: IconProps) {
  return <MoveVertical {...getIconProps(props)} />;
}
