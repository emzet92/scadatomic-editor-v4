import { ExternalLink } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide ExternalLink glyph. */
export function ExternalLinkIcon(props: IconProps) {
  return <ExternalLink {...getIconProps(props)} />;
}
