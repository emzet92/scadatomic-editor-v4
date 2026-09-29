import { Activity } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Activity glyph. */
export function ActivityIcon(props: IconProps) {
  return <Activity {...getIconProps(props)} />;
}
