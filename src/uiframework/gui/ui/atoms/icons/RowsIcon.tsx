import { Rows3 } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Rows3 glyph. */
export function RowsIcon(props: IconProps) {
  return <Rows3 {...getIconProps(props)} />;
}
