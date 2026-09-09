import type { UiComponentDefinition, UiDocument } from "../../core/document";
import { ComponentDesignerSurface } from "../../designer/ComponentDesignerSurface";
import type { ComponentRegistry } from "../../registry/editor-registry";

/** @deprecated Use ComponentDesignerSurface. Kept as a compatibility adapter. */
export function ComponentDefinitionControls({
  definition,
  registry,
  selectedNodeId,
  onSelectNode,
}: {
  projectDocument: UiDocument;
  definition: UiComponentDefinition;
  registry: ComponentRegistry;
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
}) {
  return (
    <ComponentDesignerSurface
      componentId={definition.id}
      selectedNodeId={selectedNodeId}
      onSelectNode={onSelectNode}
      registry={registry}
    />
  );
}
