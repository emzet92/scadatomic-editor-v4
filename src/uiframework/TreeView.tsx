import { useState } from "react";
import { useEditorStore } from "./editor-store";

function TreeNode({
    nodeId,
    level = 0,
}: {
    nodeId: string;
    level?: number;
}) {
    const nodes = useEditorStore(
        (s) => s.nodes
    );

    const selectedNodeId =
        useEditorStore(
            (s) => s.selectedNodeId
        );

    const setSelectedNodeId =
        useEditorStore(
            (s) => s.setSelectedNodeId
        );

    const node = nodes[nodeId];

    if (!node) {
        return null;
    }

const [collapsed, setCollapsed] = useState(level > 0);

const hasChildren =
  (node.children?.length ?? 0) > 0;

return (
  <>
    <div
      className={`
        flex
        items-center
        gap-1
        px-2
        py-1
        rounded
        cursor-pointer
        text-sm
        hover:bg-zinc-800
        ${
          selectedNodeId === nodeId
            ? "bg-sky-900"
            : ""
        }
      `}
      style={{
        paddingLeft:
          level * 16 + 8,
      }}
    >
      <span
        className="
          w-4
          text-zinc-500
          select-none
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
        {hasChildren
          ? collapsed
            ? "▸"
            : "▾"
          : ""}
      </span>

      <span
        className="flex-1"
        onClick={() =>
          setSelectedNodeId(nodeId)
        }
      >
        {node.type} ({node.id})
      </span>
    </div>

    {!collapsed &&
      (node.children ?? []).map(
        (childId) => (
          <TreeNode
            key={childId}
            nodeId={childId}
            level={level + 1}
          />
        )
      )}
  </>
);
}

export function TreeView() {
    const nodes = useEditorStore(
        (s) => s.nodes
    );

    if (!nodes.root) {
        return null;
    }

    return (
        <div className="space-y-1">
            <div className="mb-2 text-xs uppercase text-zinc-500">
                Project Tree
            </div>

            <TreeNode nodeId="root" />
        </div>
    );
}