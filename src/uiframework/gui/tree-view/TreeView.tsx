import { useEditorStore } from "../../editor-store";
import { TreeNode } from "./TreeNode";

export function TreeView() {
  const document = useEditorStore((state) => state.document);
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const selectedNodeIds = useEditorStore((state) => state.selectedNodeIds);
  const selectNode = useEditorStore((state) => state.selectNode);
  const moveNodeUp = useEditorStore((state) => state.moveNodeUp);
  const moveNodeDown = useEditorStore((state) => state.moveNodeDown);

  if (!document.nodes[document.rootId]) return null;

  return (
    <div className="space-y-1">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs uppercase tracking-wide font-semibold text-[var(--editor-text-muted)]">
          Page tree
        </div>
        {selectedNodeIds.length > 1 ? (
          <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
            {selectedNodeIds.length} selected
          </span>
        ) : null}
      </div>

      <TreeNode
        nodeId={document.rootId}
        nodes={document.nodes}
        selectedNodeId={selectedNodeId}
        selectedNodeIds={selectedNodeIds}
        selectNode={selectNode}
        moveNodeUp={moveNodeUp}
        moveNodeDown={moveNodeDown}
      />
    </div>
  );
}
