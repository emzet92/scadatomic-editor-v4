export function TreeNodeLabel({
  nodeId,
  type,
  setSelectedNodeId,
}: {
  nodeId: string;
  type: string;
  setSelectedNodeId: (nodeId: string) => void;
}) {
  return (
    <div
      className="
        flex-1
        min-w-0
        truncate
        text-sm
      "
      onClick={() =>
        setSelectedNodeId(nodeId)
      }
    >
      {type}
    </div>
  );
}