import { KeyRound } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide KeyRound glyph. */
export function KeyIcon(props: IconProps) {
  return <KeyRound {...getIconProps(props)} />;
}
