import { ArrowLeft } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide ArrowLeft glyph. */
export function BackIcon(props: IconProps) {
  return <ArrowLeft {...getIconProps(props)} />;
}
