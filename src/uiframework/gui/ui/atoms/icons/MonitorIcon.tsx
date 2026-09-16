import { Monitor } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Monitor glyph. */
export function MonitorIcon(props: IconProps) {
  return <Monitor {...getIconProps(props)} />;
}
