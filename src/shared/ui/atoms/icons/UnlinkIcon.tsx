import { Unlink } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Unlink glyph. */
export function UnlinkIcon(props: IconProps) {
  return <Unlink {...getIconProps(props)} />;
}
