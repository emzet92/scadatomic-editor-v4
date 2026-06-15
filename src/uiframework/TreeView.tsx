import { useState } from "react";
import { useEditorStore } from "./editor-store";
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
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

  const moveNodeUp =
    useEditorStore(
      (s) => s.moveNodeUp
    );

  const moveNodeDown =
    useEditorStore(
      (s) => s.moveNodeDown
    );

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
        group
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

        {nodeId !== "root" && (
          <div
            className="
            flex
            items-center
            gap-1
            shrink-0
          "
          >
            <button
              data-editor-ignore
              onClick={(e) => {
                e.stopPropagation();
                moveNodeUp(nodeId);
              }}
              className="
              p-1
              rounded
              text-zinc-500
              hover:bg-zinc-700
              hover:text-white
            "
            >
              <ChevronUp size={14} />
            </button>

            <button
              data-editor-ignore
              onClick={(e) => {
                e.stopPropagation();
                moveNodeDown(nodeId);
              }}
              className="
              p-1
              rounded
              text-zinc-500
              hover:bg-zinc-700
              hover:text-white
            "
            >
              <ChevronDown size={14} />
            </button>
          </div>
        )}
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