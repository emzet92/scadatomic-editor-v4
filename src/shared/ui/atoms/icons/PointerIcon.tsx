import { MousePointer2 } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide MousePointer2 glyph. */
export function PointerIcon(props: IconProps) {
  return <MousePointer2 {...getIconProps(props)} />;
}
