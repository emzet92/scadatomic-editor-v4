import {
  Box,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  DeleteIcon,
  IconButton
} from "../ui";

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
    <Box className="flex shrink-0 items-center gap-1">
      {canDuplicate ? (
        <IconButton
          aria-label="Duplicate node"
          size="icon-xs"
          onClick={(event) => {
            event.stopPropagation();
            duplicateNode(nodeId);
          }}
        >
          <CopyIcon size={14} />
        </IconButton>
      ) : null}

      {canDelete ? (
        <IconButton
          aria-label="Delete node"
          variant="danger"
          size="icon-xs"
          onClick={(event) => {
            event.stopPropagation();
            deleteNode(nodeId);
          }}
        >
          <DeleteIcon size={14} />
        </IconButton>
      ) : null}

      <IconButton
        aria-label="Move node up"
        size="icon-xs"
        onClick={(event) => {
          event.stopPropagation();
          moveNodeUp(nodeId);
        }}
      >
        <ChevronUpIcon size={14} />
      </IconButton>

      <IconButton
        aria-label="Move node down"
        size="icon-xs"
        onClick={(event) => {
          event.stopPropagation();
          moveNodeDown(nodeId);
        }}
      >
        <ChevronDownIcon size={14} />
      </IconButton>
    </Box>
  );
}
