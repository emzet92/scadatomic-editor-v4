import { Radio } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Radio glyph. */
export function RadioIcon(props: IconProps) {
  return <Radio {...getIconProps(props)} />;
}
