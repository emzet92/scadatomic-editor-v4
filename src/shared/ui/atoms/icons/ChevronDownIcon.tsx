import { ChevronDown } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide ChevronDown glyph. */
export function ChevronDownIcon(props: IconProps) {
  return <ChevronDown {...getIconProps(props)} />;
}
