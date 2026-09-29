import { ChevronRight } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide ChevronRight glyph. */
export function ChevronRightIcon(props: IconProps) {
  return <ChevronRight {...getIconProps(props)} />;
}
