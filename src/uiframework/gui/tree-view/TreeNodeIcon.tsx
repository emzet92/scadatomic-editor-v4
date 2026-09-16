import { Box } from "../ui";
import { getNodeIcon } from "./getNodeIcon";

export function TreeNodeIcon({
  type,
}: {
  type: string;
}) {
  return (
    <Box
      className="
        text-[var(--editor-text-soft)]
        shrink-0
      "
    >
      {getNodeIcon(type)}
    </Box>
  );
}