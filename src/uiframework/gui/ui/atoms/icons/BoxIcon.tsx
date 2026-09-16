import { Box } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Box glyph. */
export function BoxIcon(props: IconProps) {
  return <Box {...getIconProps(props)} />;
}
