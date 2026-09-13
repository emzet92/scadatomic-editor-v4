import {
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
} from "lucide-react";

export function TreeNodeMoveActions({
  nodeId,
  moveNodeUp,
  moveNodeDown,
  duplicateNode,
  canDuplicate,
  deleteNode,
  canDelete,
}: {
  nodeId: string;
  moveNodeUp: (nodeId: string) => void;
  moveNodeDown: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => string | null;
  canDuplicate: boolean;
  deleteNode: (nodeId: string) => void;
  canDelete: boolean;
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

      {canDelete ? (
        <button
          data-editor-ignore
          type="button"
          aria-label="Delete node"
          title="Delete"
          onClick={(e) => {
            e.stopPropagation();
            deleteNode(nodeId);
          }}
          className="
            p-1
            rounded-md
            text-[var(--editor-text-soft)]
            hover:bg-red-50
            hover:text-[var(--editor-danger)]
            transition
          "
        >
          <Trash2 size={14} />
        </button>
      ) : null}

      <button
        data-editor-ignore
        type="button"
        aria-label="Move node up"
        title="Move up"
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
        type="button"
        aria-label="Move node down"
        title="Move down"
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
