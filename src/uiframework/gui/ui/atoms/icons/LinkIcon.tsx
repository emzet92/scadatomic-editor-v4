import { Link2 } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Link2 glyph. */
export function LinkIcon(props: IconProps) {
  return <Link2 {...getIconProps(props)} />;
}
