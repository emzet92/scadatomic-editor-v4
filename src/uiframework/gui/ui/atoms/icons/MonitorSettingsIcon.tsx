import { MonitorCog } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide MonitorCog glyph. */
export function MonitorSettingsIcon(props: IconProps) {
  return <MonitorCog {...getIconProps(props)} />;
}
