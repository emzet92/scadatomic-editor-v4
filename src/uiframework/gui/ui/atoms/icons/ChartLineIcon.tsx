import { ChartLine } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide ChartLine glyph. */
export function ChartLineIcon(props: IconProps) {
  return <ChartLine {...getIconProps(props)} />;
}
