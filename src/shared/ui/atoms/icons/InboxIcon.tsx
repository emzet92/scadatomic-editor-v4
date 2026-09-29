import { Inbox } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Inbox glyph. */
export function InboxIcon(props: IconProps) {
  return <Inbox {...getIconProps(props)} />;
}
