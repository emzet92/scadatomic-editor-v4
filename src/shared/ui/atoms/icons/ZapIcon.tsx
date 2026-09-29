import { Zap } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Zap glyph. */
export function ZapIcon(props: IconProps) {
  return <Zap {...getIconProps(props)} />;
}
