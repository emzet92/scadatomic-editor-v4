import { MousePointerClick } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide MousePointerClick glyph. */
export function PointerClickIcon(props: IconProps) {
  return <MousePointerClick {...getIconProps(props)} />;
}
