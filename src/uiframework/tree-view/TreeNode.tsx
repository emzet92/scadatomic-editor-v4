import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import type { TreeNodeProps } from "./tree-view-types";
import { getNodeIcon } from "./getNodeIcon";
import { TreeNodeMoveActions } from "./TreeNodeMoveActions";

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

          ${selectedNodeId === nodeId
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
        <div
          className="
            flex
            items-center
            justify-center
            w-4
            h-4
            text-zinc-500
            shrink-0
          "
          onClick={(e) => {
            e.stopPropagation();

            if (hasChildren) {
              setCollapsed(
                !collapsed
              );
            }
          }}
        >
          {hasChildren ? (
            collapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronDown size={14} />
            )
          ) : (
            <div className="w-3" />
          )}
        </div>

        <div
          className="
            text-zinc-400
            shrink-0
          "
        >
          {getNodeIcon(node.type)}
        </div>

        <div
          className="
            flex-1
            min-w-0
            truncate
          "
          onClick={() =>
            setSelectedNodeId(nodeId)
          }
        >
          {node.type}
        </div>

        <TreeNodeMoveActions
          nodeId={nodeId}
          moveNodeUp={moveNodeUp}
          moveNodeDown={moveNodeDown}
        />
      </div>

      {!collapsed &&
        (node.children ?? []).map(
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
