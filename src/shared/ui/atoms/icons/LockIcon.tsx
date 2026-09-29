import { LockKeyhole } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide LockKeyhole glyph. */
export function LockIcon(props: IconProps) {
  return <LockKeyhole {...getIconProps(props)} />;
}
