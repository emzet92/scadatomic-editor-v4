import { useState } from "react";
import type { TreeNodeProps } from "./tree-view-types";
import { TreeNodeRow } from "./TreeNodeRow";
import { TreeNodeChildren } from "./TreeNodeChildren";

export function TreeNode({
  nodeId,
  level = 0,
  nodes,
  selectedNodeId,
  selectedNodeIds = [],
  selectNode,
  moveNodeUp,
  moveNodeDown,
}: TreeNodeProps) {
  const node = nodes[nodeId];
  const [collapsed, setCollapsed] = useState(level > 0);

  if (!node) return null;

  const hasChildren = (node.children?.length ?? 0) > 0;
  const selected = selectedNodeIds.includes(nodeId);

  return (
    <>
      <TreeNodeRow
        nodeId={nodeId}
        node={node}
        level={level}
        collapsed={collapsed}
        hasChildren={hasChildren}
        selected={selected}
        primarySelected={selectedNodeId === nodeId}
        setCollapsed={setCollapsed}
        selectNode={selectNode}
        moveNodeUp={moveNodeUp}
        moveNodeDown={moveNodeDown}
      />

      {!collapsed && (
        <TreeNodeChildren
          node={node}
          level={level}
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          selectedNodeIds={selectedNodeIds}
          selectNode={selectNode}
          moveNodeUp={moveNodeUp}
          moveNodeDown={moveNodeDown}
        />
      )}
    </>
  );
}
