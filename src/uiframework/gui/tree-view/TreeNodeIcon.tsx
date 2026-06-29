import { getNodeIcon } from "./getNodeIcon";

export function TreeNodeIcon({
  type,
}: {
  type: string;
}) {
  return (
    <div
      className="
        text-[var(--editor-text-soft)]
        shrink-0
      "
    >
      {getNodeIcon(type)}
    </div>
  );
}