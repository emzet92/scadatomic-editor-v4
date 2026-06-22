import { useEditorStore } from "../../editor-store";
import type { UiTree } from "../../Renderer";
import { getDefaultPropsForType } from "../../UiTree";
import { isEventProp } from "./event-props";
import { EventsEditor } from "./EventsEditor";
import { PropertyPanelEmpty } from "./PropertyPanelEmpty";
import { PropertyPanelHeader } from "./PropertyPanelHeader";
import { PropertyPanelNodeNotFound } from "./PropertyPanelNodeNotFound";
import { PropsEditor } from "./PropsEditor";


type Props = {
  nodes: UiTree;
};

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

 const propsToRender = {
  ...getDefaultPropsForType(node.type),
  ...(node.props ?? {}),
};

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
