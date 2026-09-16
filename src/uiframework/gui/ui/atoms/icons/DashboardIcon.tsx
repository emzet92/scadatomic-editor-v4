import { LayoutDashboard } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide LayoutDashboard glyph. */
export function DashboardIcon(props: IconProps) {
  return <LayoutDashboard {...getIconProps(props)} />;
}
