import { Database } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Database glyph. */
export function DatabaseIcon(props: IconProps) {
  return <Database {...getIconProps(props)} />;
}
