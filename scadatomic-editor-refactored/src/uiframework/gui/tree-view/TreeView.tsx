import { useEditorStore } from "../../editor-store";
import { TreeNode } from "./TreeNode";

export function TreeView() {
  const document = useEditorStore((state) => state.document);
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useEditorStore((state) => state.setSelectedNodeId);
  const moveNodeUp = useEditorStore((state) => state.moveNodeUp);
  const moveNodeDown = useEditorStore((state) => state.moveNodeDown);

  if (!document.nodes[document.rootId]) {
    return null;
  }

  return (
    <div className="space-y-1">
      <div className="mb-2 text-xs uppercase tracking-wide font-semibold text-[var(--editor-text-muted)]">
        Project Tree
      </div>

      <TreeNode
        nodeId={document.rootId}
        nodes={document.nodes}
        selectedNodeId={selectedNodeId}
        setSelectedNodeId={setSelectedNodeId}
        moveNodeUp={moveNodeUp}
        moveNodeDown={moveNodeDown}
      />
    </div>
  );
}
