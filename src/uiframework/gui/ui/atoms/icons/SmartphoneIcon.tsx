import { Smartphone } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Smartphone glyph. */
export function SmartphoneIcon(props: IconProps) {
  return <Smartphone {...getIconProps(props)} />;
}
