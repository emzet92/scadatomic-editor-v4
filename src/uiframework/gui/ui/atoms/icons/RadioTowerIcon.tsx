import { RadioTower } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide RadioTower glyph. */
export function RadioTowerIcon(props: IconProps) {
  return <RadioTower {...getIconProps(props)} />;
}
