import { ChevronUp } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide ChevronUp glyph. */
export function ChevronUpIcon(props: IconProps) {
  return <ChevronUp {...getIconProps(props)} />;
}
