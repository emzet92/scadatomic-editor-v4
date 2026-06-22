import type {
  TreeNodeData,
  TreeNodes,
} from "./tree-view-types";
import { TreeNode } from "./TreeNode";

export function TreeNodeChildren({
  node,
  level,
  nodes,
  selectedNodeId,
  setSelectedNodeId,
  moveNodeUp,
  moveNodeDown,
}: {
  node: TreeNodeData;
  level: number;
  nodes: TreeNodes;
  selectedNodeId?: string | null;
  setSelectedNodeId: (nodeId: string) => void;
  moveNodeUp: (nodeId: string) => void;
  moveNodeDown: (nodeId: string) => void;
}) {
  return (
    <>
      {(node.children ?? []).map(
        (childId) => (
          <TreeNode
            key={childId}
            nodeId={childId}
            level={level + 1}
            nodes={nodes}
            selectedNodeId={selectedNodeId}
            setSelectedNodeId={setSelectedNodeId}
            moveNodeUp={moveNodeUp}
            moveNodeDown={moveNodeDown}
          />
        )
      )}
    </>
  );
}
