import {
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export function TreeNodeMoveActions({
  nodeId,
  moveNodeUp,
  moveNodeDown,
}: {
  nodeId: string;
  moveNodeUp: (nodeId: string) => void;
  moveNodeDown: (nodeId: string) => void;
}) {
  if (nodeId === "root") {
    return null;
  }

  return (
    <div
      className="
        flex
        items-center
        gap-1
        shrink-0
      "
    >
      <button
        data-editor-ignore
        onClick={(e) => {
          e.stopPropagation();
          moveNodeUp(nodeId);
        }}
        className="
          p-1
          rounded
          text-zinc-500
          hover:bg-zinc-700
          hover:text-white
        "
      >
        <ChevronUp size={14} />
      </button>

      <button
        data-editor-ignore
        onClick={(e) => {
          e.stopPropagation();
          moveNodeDown(nodeId);
        }}
        className="
          p-1
          rounded
          text-zinc-500
          hover:bg-zinc-700
          hover:text-white
        "
      >
        <ChevronDown size={14} />
      </button>
    </div>
  );
}
