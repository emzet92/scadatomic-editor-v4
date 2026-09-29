import { Plus } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Plus glyph. */
export function AddIcon(props: IconProps) {
  return <Plus {...getIconProps(props)} />;
}
