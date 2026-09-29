import { Code2 } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Code2 glyph. */
export function CodeIcon(props: IconProps) {
  return <Code2 {...getIconProps(props)} />;
}
