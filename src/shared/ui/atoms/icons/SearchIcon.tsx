import { Search } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Search glyph. */
export function SearchIcon(props: IconProps) {
  return <Search {...getIconProps(props)} />;
}
