import { getNodeIcon } from "./getNodeIcon";

export function TreeNodeIcon({
  type,
}: {
  type: string;
}) {
  return (
    <div
      className="
        text-zinc-400
        shrink-0
      "
    >
      {getNodeIcon(type)}
    </div>
  );
}
