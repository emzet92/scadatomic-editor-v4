import { FunctionSquare } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide FunctionSquare glyph. */
export function FunctionIcon(props: IconProps) {
  return <FunctionSquare {...getIconProps(props)} />;
}
