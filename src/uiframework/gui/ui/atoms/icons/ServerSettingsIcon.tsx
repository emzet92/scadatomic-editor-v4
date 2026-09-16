import { ServerCog } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide ServerCog glyph. */
export function ServerSettingsIcon(props: IconProps) {
  return <ServerCog {...getIconProps(props)} />;
}
