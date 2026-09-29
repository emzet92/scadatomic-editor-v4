import { MoveHorizontal } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide MoveHorizontal glyph. */
export function HorizontalResizeIcon(props: IconProps) {
  return <MoveHorizontal {...getIconProps(props)} />;
}
