import { Settings } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Settings glyph. */
export function SettingsIcon(props: IconProps) {
  return <Settings {...getIconProps(props)} />;
}
