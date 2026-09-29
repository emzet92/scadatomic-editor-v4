import { FileText } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide FileText glyph. */
export function FileTextIcon(props: IconProps) {
  return <FileText {...getIconProps(props)} />;
}
