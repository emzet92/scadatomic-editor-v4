import { Workflow } from "lucide-react";
import { getIconProps, type IconProps } from "./iconSystem";

/** Design-system wrapper around the Lucide Workflow glyph. */
export function WorkflowIcon(props: IconProps) {
  return <Workflow {...getIconProps(props)} />;
}
