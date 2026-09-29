import { Bell } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Bell glyph. */
export function NotificationIcon(props: IconProps) {
  return <Bell {...getIconProps(props)} />;
}
