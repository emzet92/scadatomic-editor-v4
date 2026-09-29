import { Save } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Save glyph. */
export function SaveIcon(props: IconProps) {
  return <Save {...getIconProps(props)} />;
}
