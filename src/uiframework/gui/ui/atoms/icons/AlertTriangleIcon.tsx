import { AlertTriangle } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide AlertTriangle glyph. */
export function AlertTriangleIcon(props: IconProps) {
  return <AlertTriangle {...getIconProps(props)} />;
}
