import { Home } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Home glyph. */
export function HomeIcon(props: IconProps) {
  return <Home {...getIconProps(props)} />;
}
