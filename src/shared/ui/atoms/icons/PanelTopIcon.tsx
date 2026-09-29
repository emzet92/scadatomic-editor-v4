import { PanelTop } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide PanelTop glyph. */
export function PanelTopIcon(props: IconProps) {
  return <PanelTop {...getIconProps(props)} />;
}
