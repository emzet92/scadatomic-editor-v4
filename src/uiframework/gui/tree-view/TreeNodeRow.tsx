import type { TreeNodeData } from "./tree-view-types";
import { TreeNodeToggle } from "./TreeNodeToggle";
import { TreeNodeIcon } from "./TreeNodeIcon";
import { TreeNodeLabel } from "./TreeNodeLabel";
import { TreeNodeMoveActions } from "./TreeNodeMoveActions";

export function TreeNodeRow({
  nodeId,
  node,
  level,
  collapsed,
  hasChildren,
  selected,
  setCollapsed,
  setSelectedNodeId,
  moveNodeUp,
  moveNodeDown,
}: {
  nodeId: string;
  node: TreeNodeData;
  level: number;
  collapsed: boolean;
  hasChildren: boolean;
  selected: boolean;
  setCollapsed: (collapsed: boolean) => void;
  setSelectedNodeId: (nodeId: string) => void;
  moveNodeUp: (nodeId: string) => void;
  moveNodeDown: (nodeId: string) => void;
}) {
  return (
    <div
      className={`
        group
        flex
        items-center
        gap-2

        px-2
        py-1.5

        rounded-md

        cursor-pointer
        text-sm

        transition-colors

        ${
          selected
            ? `
              bg-sky-50
              text-sky-700
              border-l-2
              border-sky-500
            `
            : `
              text-zinc-700
              hover:bg-zinc-100
            `
        }
      `}
      style={{
        paddingLeft:
          level * 16 + 8,
      }}
    >
      <TreeNodeToggle
        collapsed={collapsed}
        hasChildren={hasChildren}
        setCollapsed={setCollapsed}
      />

      <TreeNodeIcon type={node.type} />

      <TreeNodeLabel
        nodeId={nodeId}
        type={node.type}
        setSelectedNodeId={setSelectedNodeId}
      />

      <TreeNodeMoveActions
        nodeId={nodeId}
        moveNodeUp={moveNodeUp}
        moveNodeDown={moveNodeDown}
      />
    </div>
  );
}
