import { Network } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Network glyph. */
export function NetworkIcon(props: IconProps) {
  return <Network {...getIconProps(props)} />;
}
