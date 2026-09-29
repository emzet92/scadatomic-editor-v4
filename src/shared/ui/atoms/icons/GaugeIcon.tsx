import { Gauge } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Gauge glyph. */
export function GaugeIcon(props: IconProps) {
  return <Gauge {...getIconProps(props)} />;
}
