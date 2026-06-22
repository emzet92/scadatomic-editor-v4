import { useEditorStore } from "../editor-store";
import { TreeNode } from "./TreeNode";

export function TreeView() {
  const nodes = useEditorStore(
    (s) => s.nodes
  );

  const selectedNodeId = useEditorStore(
    (s) => s.selectedNodeId
  );

  const setSelectedNodeId = useEditorStore(
    (s) => s.setSelectedNodeId
  );

  const moveNodeUp = useEditorStore(
    (s) => s.moveNodeUp
  );

  const moveNodeDown = useEditorStore(
    (s) => s.moveNodeDown
  );

  if (!nodes.root) {
    return null;
  }

  return (
    <div className="space-y-1">
      <div className="mb-2 text-xs uppercase text-zinc-500">
        Project Tree
      </div>

      <TreeNode
        nodeId="root"
        nodes={nodes}
        selectedNodeId={selectedNodeId}
        setSelectedNodeId={setSelectedNodeId}
        moveNodeUp={moveNodeUp}
        moveNodeDown={moveNodeDown}
      />
    </div>
  );
}
