import {
  ChevronUp,
  ChevronDown,
  Copy,
} from "lucide-react";

export function TreeNodeMoveActions({
  nodeId,
  moveNodeUp,
  moveNodeDown,
  duplicateNode,
  canDuplicate,
}: {
  nodeId: string;
  moveNodeUp: (nodeId: string) => void;
  moveNodeDown: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => string | null;
  canDuplicate: boolean;
}) {
  if (nodeId === "root" && !canDuplicate) {
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
      {canDuplicate ? (
        <button
          data-editor-ignore
          type="button"
          aria-label="Duplicate node"
          title="Duplicate"
          onClick={(e) => {
            e.stopPropagation();
            duplicateNode(nodeId);
          }}
          className="
            p-1
            rounded-md
            text-[var(--editor-text-soft)]
            hover:bg-[var(--editor-accent-soft)]
            hover:text-[var(--editor-accent)]
            transition
          "
        >
          <Copy size={14} />
        </button>
      ) : null}

      <button
        data-editor-ignore
        onClick={(e) => {
          e.stopPropagation();
          moveNodeUp(nodeId);
        }}
        className="
          p-1
          rounded-md
          text-[var(--editor-text-soft)]
          hover:bg-[var(--editor-accent-soft)]
          hover:text-[var(--editor-accent)]
          transition
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
          rounded-md
          text-[var(--editor-text-soft)]
          hover:bg-[var(--editor-accent-soft)]
          hover:text-[var(--editor-accent)]
          transition
        "
      >
        <ChevronDown size={14} />
      </button>
    </div>
  );
}
