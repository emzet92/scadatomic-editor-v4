import type { UiTree } from "./Renderer";
import { useEditorStore } from "./editor-store";
import { PropertyPanelEmpty } from "./property-panel/PropertyPanelEmpty";
import { PropertyPanelNodeNotFound } from "./property-panel/PropertyPanelNodeNotFound";
import { PropertyPanelHeader } from "./property-panel/PropertyPanelHeader";
import { PropsEditor } from "./property-panel/PropsEditor";
import { EventsEditor } from "./property-panel/EventsEditor";
import { isEventProp } from "./property-panel/event-props";

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
