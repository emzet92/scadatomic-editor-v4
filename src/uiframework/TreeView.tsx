import { useState } from "react";
import { useEditorStore } from "./editor-store";
import {
  ChevronRight,
  ChevronDown,
  Box,
  Type,
  RectangleHorizontal,
} from "lucide-react";

function getNodeIcon(type: string) {
  switch (type) {
    case "Container":
      return <Box size={14} />;

    case "Text":
      return <Type size={14} />;

    case "Button":
      return (
        <RectangleHorizontal
          size={14}
        />
      );

    default:
      return <Box size={14} />;
  }
}

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
        gap-2
        px-2
        py-1
        rounded
        cursor-pointer
        text-sm
        hover:bg-zinc-800
        ${selectedNodeId === nodeId
            ? "bg-sky-900"
            : ""
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
              <ChevronRight
                size={14}
              />
            ) : (
              <ChevronDown
                size={14}
              />
            )
          ) : null}
        </div>

        <div className="text-zinc-400">
          {getNodeIcon(node.type)}
        </div>

        <div
          className="flex-1"
          onClick={() =>
            setSelectedNodeId(nodeId)
          }
        >
          {node.type}
        </div>
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