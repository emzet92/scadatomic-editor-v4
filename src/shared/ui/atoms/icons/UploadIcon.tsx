import { Upload } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Upload glyph. */
export function UploadIcon(props: IconProps) {
  return <Upload {...getIconProps(props)} />;
}
