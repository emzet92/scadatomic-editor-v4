import type { UiTree } from "./Renderer";

type Props = {
  nodes: UiTree;
  selectedNodeId: string | null;
};

export function PropertyPanel({
  nodes,
  selectedNodeId,
}: Props) {
  if (!selectedNodeId) {
    return <div>No selection</div>;
  }

  const node = nodes[selectedNodeId];

  return (
    <>
      <h3>{node.type}</h3>

      {Object.entries(node.props ?? {}).map(
        ([key, value]) => (
          <div key={key}>
            <label>{key}</label>

            <input
              value={String(value)}
              readOnly
            />
          </div>
        )
      )}
    </>
  );
}