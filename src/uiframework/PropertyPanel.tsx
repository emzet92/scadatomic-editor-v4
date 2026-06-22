import type { UiTree } from "./Renderer";
import { useEditorStore } from "./editor-store";

type Props = {
  nodes: UiTree;
};

type UiNode = UiTree[string];

type PropEntry = [string, unknown];

type UpdateNode = (
  nodeId: string,
  updater: (node: UiNode) => UiNode
) => void;

const eventProps: Record<string, string> = {
  onClickEvent: "Clicked",
  onDoubleClickEvent: "DoubleClicked",
};

function isEventProp(key: string) {
  return key in eventProps;
}

export function PropertyPanel({ nodes }: Props) {
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const updateNode = useEditorStore((s) => s.updateNode);

  if (!selectedNodeId) {
    return <PropertyPanelEmpty />;
  }

  const node = nodes[selectedNodeId];

  if (!node) {
    return <PropertyPanelNodeNotFound />;
  }

  const propsToRender = node.props ?? {};

  const normalProps = Object.entries(propsToRender).filter(
    ([key]) => !isEventProp(key)
  );

  const runtimeEventProps = Object.entries(propsToRender).filter(
    ([key]) => isEventProp(key)
  );

  return (
    <div
      data-editor-ignore
      className="h-full flex flex-col"
    >
      <PropertyPanelHeader node={node} />

      <div
        className="
          flex-1
          overflow-auto
          p-4
          space-y-6
        "
      >
        <PropsEditor
          nodeId={node.id}
          props={normalProps}
          updateNode={updateNode}
        />

        {runtimeEventProps.length > 0 && (
          <EventsEditor
            nodeId={node.id}
            props={runtimeEventProps}
            updateNode={updateNode}
          />
        )}
      </div>
    </div>
  );
}

function PropertyPanelEmpty() {
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

function PropertyPanelNodeNotFound() {
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

function PropertyPanelHeader({ node }: { node: UiNode }) {
  return (
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
  );
}

function PropsEditor({
  nodeId,
  props,
  updateNode,
}: {
  nodeId: string;
  props: PropEntry[];
  updateNode: UpdateNode;
}) {
  return (
    <div className="space-y-4">
      {props.map(([key, value]) => (
        <PropInput
          key={key}
          nodeId={nodeId}
          propName={key}
          value={value}
          updateNode={updateNode}
        />
      ))}
    </div>
  );
}

function PropInput({
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

function EventsEditor({
  nodeId,
  props,
  updateNode,
}: {
  nodeId: string;
  props: PropEntry[];
  updateNode: UpdateNode;
}) {
  return (
    <div
      className="
        pt-4
        border-t
        border-zinc-200
        space-y-3
      "
    >
      <div>
        <div
          className="
            text-xs
            font-semibold
            uppercase
            tracking-wide
            text-zinc-500
          "
        >
          Events
        </div>

        <div
          className="
            mt-1
            text-xs
            text-zinc-400
          "
        >
          Enable runtime events emitted by this component.
        </div>
      </div>

      <div className="space-y-3">
        {props.map(([key, value]) => (
          <EventCheckbox
            key={key}
            nodeId={nodeId}
            propName={key}
            value={value}
            suffix={eventProps[key]}
            updateNode={updateNode}
          />
        ))}
      </div>
    </div>
  );
}

function EventCheckbox({
  nodeId,
  propName,
  value,
  suffix,
  updateNode,
}: {
  nodeId: string;
  propName: string;
  value: unknown;
  suffix: string;
  updateNode: UpdateNode;
}) {
  const checked = Boolean(value);
  const generatedEventName = `${nodeId}.${suffix}`;

  return (
    <label
      className="
        flex
        items-center
        gap-3
        rounded-lg
        border
        border-zinc-200
        bg-white
        px-3
        py-3
        cursor-pointer
        hover:bg-zinc-50
      "
    >
      <input
        data-editor-ignore
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          const checked = e.target.checked;

          updateNode(nodeId, (currentNode) => {
            const nextProps: Record<string, unknown> = {
              ...(currentNode.props ?? {}),
            };

            if (checked) {
              nextProps[propName] = generatedEventName;
            } else {
              nextProps[propName] = "";
            }

            return {
              ...currentNode,
              props: nextProps,
            };
          });
        }}
        className="
          h-4
          w-4
          rounded
          border-zinc-300
          text-sky-600
          focus:ring-sky-500
        "
      />

      <div className="min-w-0">
        <div
          className="
            text-sm
            font-medium
            text-zinc-800
          "
        >
          {propName}
        </div>

        <div
          className="
            text-xs
            text-zinc-500
            truncate
          "
        >
          {checked ? String(value) : generatedEventName}
        </div>
      </div>
    </label>
  );
}