import type { UiTree } from "./Renderer";
import { useEditorStore } from "./editor-store";

type Props = {
  nodes: UiTree;
};

export function PropertyPanel({
  nodes,
}: Props) {
  const selectedNodeId =
    useEditorStore(
      (s) => s.selectedNodeId
    );

  const updateNode =
    useEditorStore(
      (s) => s.updateNode
    );

  if (!selectedNodeId) {
    return (
      <div
        data-editor-ignore
        className="text-zinc-400 text-sm"
      >
        No selection
      </div>
    );
  }

  const node = nodes[selectedNodeId];

  if (!node) {
    return (
      <div
        data-editor-ignore
        className="text-red-400 text-sm"
      >
        Node not found
      </div>
    );
  }

  const propsToRender =
    node.props ?? {};

  return (
    <div
      data-editor-ignore
      className="space-y-4"
    >
      {/* Header */}

      <div className="border-b pb-3">
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          Component
        </div>

        <div className="font-medium text-zinc-100">
          {node.type}
        </div>

        <div className="text-xs text-zinc-400">
          {node.id}
        </div>
      </div>

      {/* Properties */}

      <div className="space-y-3">
        {Object.entries(
          propsToRender
        ).map(([key, value]) => (
          <div
            key={key}
            className="space-y-1"
          >
            <label
              className="
                block
                text-xs
                font-medium
                text-zinc-400
                uppercase
                tracking-wide
              "
            >
              {key}
            </label>

            <input
              data-editor-ignore
              value={String(value)}
              onChange={(e) => {
                const nextValue =
                  e.target.value;

                updateNode(
                  node.id,
                  (
                    currentNode
                  ) => ({
                    ...currentNode,
                    props: {
                      ...currentNode.props,
                      [key]:
                        nextValue,
                    },
                  })
                );
              }}
              className="
                w-full
                rounded-md
                border
                border-zinc-700
                bg-zinc-900
                px-3
                py-2
                text-sm
                text-zinc-100
                outline-none
                transition
                focus:border-sky-500
              "
            />
          </div>
        ))}
      </div>
    </div>
  );
}