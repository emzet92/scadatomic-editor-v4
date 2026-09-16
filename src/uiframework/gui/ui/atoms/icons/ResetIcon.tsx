import { RotateCcw } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide RotateCcw glyph. */
export function ResetIcon(props: IconProps) {
  return <RotateCcw {...getIconProps(props)} />;
}
