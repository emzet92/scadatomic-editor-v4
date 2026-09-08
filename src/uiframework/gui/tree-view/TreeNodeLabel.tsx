export function TreeNodeLabel({
  nodeId,
  name,
  type,
  setSelectedNodeId,
}: {
  nodeId: string;
  name: string;
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
      title={`${name} · ${type}`}
    >
      {name}
    </div>
  );
}