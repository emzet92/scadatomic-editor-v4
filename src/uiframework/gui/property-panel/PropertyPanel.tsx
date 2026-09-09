import { useEditorStore } from "../../editor-store";
import type { UiDocument } from "../../core/document";
import { getComponentDefinition } from "../../registry/component-definitions";
import { BindingsEditor } from "./BindingsEditor";
import { EventsEditor } from "./EventsEditor";
import { PropertyPanelEmpty } from "./PropertyPanelEmpty";
import { PropertyPanelHeader } from "./PropertyPanelHeader";
import { PropertyPanelNodeNotFound } from "./PropertyPanelNodeNotFound";
import { PropsEditor } from "./PropsEditor";

type Props = {
  document: UiDocument;
};

export function PropertyPanel({ document }: Props) {
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const updateNode = useEditorStore((state) => state.updateNode);
  const renameNode = useEditorStore((state) => state.renameNode);
  const setBinding = useEditorStore((state) => state.setBinding);
  const setEvent = useEditorStore((state) => state.setEvent);

  if (!selectedNodeId) {
    return <PropertyPanelEmpty />;
  }

  const node = document.nodes[selectedNodeId];

  if (!node) {
    return <PropertyPanelNodeNotFound />;
  }

  const definition = getComponentDefinition(node.type);
  const resolvedProps = {
    ...(definition?.defaults ?? {}),
    ...(node.props ?? {}),
  };

  return (
    <div data-editor-ignore className="h-full flex flex-col">
      <PropertyPanelHeader
        key={node.id}
        node={node}
        renameNode={renameNode}
      />

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {definition ? (
          <PropsEditor
            nodeId={node.id}
            values={resolvedProps}
            controls={definition.inspector}
            updateNode={updateNode}
          />
        ) : (
          <div className="text-xs text-amber-700">
            No component definition for {node.type}.
          </div>
        )}

        {definition?.bindings && (
          <BindingsEditor
            nodeId={node.id}
            definitions={definition.bindings}
            bindings={node.bindings}
            setBinding={setBinding}
          />
        )}

        {definition?.events && (
          <EventsEditor
            nodeId={node.id}
            nodeName={node.name}
            definitions={definition.events}
            events={node.events}
            setEvent={setEvent}
          />
        )}

      </div>
    </div>
  );
}
