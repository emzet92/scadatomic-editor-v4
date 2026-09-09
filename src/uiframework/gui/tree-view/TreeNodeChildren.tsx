import type { TreeNodeData, TreeNodes, TreeSelectionOptions } from "./tree-view-types";
import { TreeNode } from "./TreeNode";

export function TreeNodeChildren({
  node,
  level,
  nodes,
  selectedNodeId,
  selectedNodeIds,
  selectNode,
  moveNodeUp,
  moveNodeDown,
}: {
  node: TreeNodeData;
  level: number;
  nodes: TreeNodes;
  selectedNodeId?: string | null | undefined;
  selectedNodeIds?: readonly string[] | undefined;
  selectNode: (nodeId: string, options?: TreeSelectionOptions) => void;
  moveNodeUp: (nodeId: string) => void;
  moveNodeDown: (nodeId: string) => void;
}) {
  return (
    <>
      {(node.children ?? []).map((childId) => (
        <TreeNode
          key={childId}
          nodeId={childId}
          level={level + 1}
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          selectedNodeIds={selectedNodeIds}
          selectNode={selectNode}
          moveNodeUp={moveNodeUp}
          moveNodeDown={moveNodeDown}
        />
      ))}
    </>
  );
}
