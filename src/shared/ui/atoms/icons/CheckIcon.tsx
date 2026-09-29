import { Check } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Check glyph. */
export function CheckIcon(props: IconProps) {
  return <Check {...getIconProps(props)} />;
}
