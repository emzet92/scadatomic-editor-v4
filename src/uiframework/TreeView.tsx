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

  return (
    <>
      <div
        onClick={() =>
          setSelectedNodeId(nodeId)
        }
        className={`
          px-2
          py-1
          rounded
          cursor-pointer
          text-sm
          hover:bg-zinc-800
          ${
            selectedNodeId ===
            nodeId
              ? "bg-sky-900"
              : ""
          }
        `}
        style={{
          paddingLeft:
            level * 16 + 8,
        }}
      >
        {node.type} ({node.id})
      </div>

      {(node.children ?? []).map(
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