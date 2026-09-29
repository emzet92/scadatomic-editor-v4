import { GitBranch } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide GitBranch glyph. */
export function BranchIcon(props: IconProps) {
  return <GitBranch {...getIconProps(props)} />;
}
