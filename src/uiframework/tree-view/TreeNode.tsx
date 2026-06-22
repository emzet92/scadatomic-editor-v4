import { useState } from "react";
import type { TreeNodeProps } from "./tree-view-types";
import { TreeNodeRow } from "./TreeNodeRow";
import { TreeNodeChildren } from "./TreeNodeChildren";


export function TreeNode({
  nodeId,
  level = 0,
  nodes,
  selectedNodeId,
  setSelectedNodeId,
  moveNodeUp,
  moveNodeDown,
}: TreeNodeProps) {
  const node = nodes[nodeId];

  const [collapsed, setCollapsed] =
    useState(level > 0);

  if (!node) {
    return null;
  }

  const hasChildren =
    (node.children?.length ?? 0) > 0;

  return (
    <>
      <TreeNodeRow
        nodeId={nodeId}
        node={node}
        level={level}
        collapsed={collapsed}
        hasChildren={hasChildren}
        selected={selectedNodeId === nodeId}
        setCollapsed={setCollapsed}
        setSelectedNodeId={setSelectedNodeId}
        moveNodeUp={moveNodeUp}
        moveNodeDown={moveNodeDown}
      />

      {!collapsed && (
        <TreeNodeChildren
          node={node}
          level={level}
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          setSelectedNodeId={setSelectedNodeId}
          moveNodeUp={moveNodeUp}
          moveNodeDown={moveNodeDown}
        />
      )}
    </>
  );
}
