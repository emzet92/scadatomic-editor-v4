import type { UpdateNode } from "./property-panel-types";

export function PropInput({
  nodeId,
  propName,
  value,
  updateNode,
}: {
  nodeId: string;
  propName: string;
  value: unknown;
  updateNode: UpdateNode;
}) {
  const isNumber = typeof value === "number";

  return (
    <div className="space-y-1">
      <label
        className="
          block
          text-xs
          font-medium
          uppercase
          tracking-wide
          text-zinc-500
        "
      >
        {propName}
      </label>

      <input
        data-editor-ignore
        type={isNumber ? "number" : "text"}
        value={String(value ?? "")}
        onChange={(e) => {
          const rawValue = e.target.value;

          const nextValue = isNumber
            ? rawValue === ""
              ? 0
              : Number(rawValue)
            : rawValue;

          updateNode(nodeId, (currentNode) => ({
            ...currentNode,
            props: {
              ...(currentNode.props ?? {}),
              [propName]: nextValue,
            },
          }));
        }}
        className="
          w-full
          h-9
          px-3
          rounded-md
          border
          border-zinc-200
          bg-white
          text-sm
          text-zinc-900
          outline-none
          transition
          focus:border-sky-500
          focus:ring-2
          focus:ring-sky-100
        "
      />
    </div>
  );
}
