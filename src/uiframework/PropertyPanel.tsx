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
        className="
          p-4
          text-sm
          text-zinc-500
        "
      >
        Select a component
      </div>
    );
  }

  const node = nodes[selectedNodeId];

  if (!node) {
    return (
      <div
        data-editor-ignore
        className="
          p-4
          text-sm
          text-red-500
        "
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
      className="h-full flex flex-col"
    >
      {/* HEADER */}

      <div
        className="
          px-4
          py-4
          border-b
          border-zinc-200
          bg-white
        "
      >
        <div
          className="
            text-xs
            font-semibold
            uppercase
            tracking-wide
            text-zinc-500
          "
        >
          Component
        </div>

        <div
          className="
            mt-1
            text-sm
            font-semibold
            text-zinc-900
          "
        >
          {node.type}
        </div>

        <div
          className="
            text-xs
            text-zinc-500
            truncate
          "
        >
          {node.id}
        </div>
      </div>

      {/* BODY */}

      <div
        className="
          flex-1
          overflow-auto
          p-4
          space-y-4
        "
      >
        {Object.entries(
          propsToRender
        ).map(([key, value]) => {
          const isNumber =
            typeof value ===
            "number";

          return (
            <div
              key={key}
              className="space-y-1"
            >
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
                {key}
              </label>

              <input
                data-editor-ignore
                type={
                  isNumber
                    ? "number"
                    : "text"
                }
                step="1"
                value={String(value)}
                onChange={(e) => {
                  const rawValue =
                    e.target.value;

                  const nextValue =
                    isNumber
                      ? rawValue === ""
                        ? 0
                        : Number(
                            rawValue
                          )
                      : rawValue;

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
        })}
      </div>
    </div>
  );
}