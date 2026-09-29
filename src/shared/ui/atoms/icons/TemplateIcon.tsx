import { LayoutTemplate } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide LayoutTemplate glyph. */
export function TemplateIcon(props: IconProps) {
  return <LayoutTemplate {...getIconProps(props)} />;
}
