import {
  Box,
  LayerStackIcon
} from "../ui";
import type { UiComponentDefinition } from "../../core/document";
import { NodeTree } from "../tree-view/NodeTree";

export function ComponentStructureTree({
  definition,
  selectedNodeId,
  onSelect,
  onDelete,
}: {
  definition: UiComponentDefinition;
  selectedNodeId: string;
  onSelect: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
}) {
  return (
    <Box data-editor-ignore className="max-h-[42vh] overflow-auto bg-[var(--editor-surface)]">
      <Box className="border-b border-[var(--editor-border)] px-4 py-3">
        <Box className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">
          <LayerStackIcon size={13} /> Component structure
        </Box>
        <Box className="mt-1 truncate text-sm font-medium text-[var(--editor-text)]">
          {definition.name}
        </Box>
        <Box className="mt-1 text-[10px] text-[var(--editor-text-muted)]">
          Private implementation
        </Box>
      </Box>
      <Box className="p-2">
        <NodeTree
          rootId={definition.rootId}
          nodes={definition.nodes}
          selectedNodeId={selectedNodeId}
          selectNode={(nodeId) => onSelect(nodeId)}
          deleteNode={onDelete}
          canDeleteNode={(nodeId) => nodeId !== definition.rootId}
        />
      </Box>
    </Box>
  );
}
