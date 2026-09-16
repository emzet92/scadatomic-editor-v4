import { RectangleHorizontal } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide RectangleHorizontal glyph. */
export function RectangleIcon(props: IconProps) {
  return <RectangleHorizontal {...getIconProps(props)} />;
}
