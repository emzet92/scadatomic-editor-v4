import { useMemo } from "react";
import type { NodeId } from "../core/document";
import { useEditorStore } from "../editor-store";
import type { ComponentRegistry } from "../registry/editor-registry";
import { createComponentDefinitionDocument } from "../reusable-components";
import { DesignerSurface } from "./DesignerSurface";
import type { DesignerAdapter } from "./designer-adapter";

export function ComponentDesignerSurface({
  componentId,
  selectedNodeId,
  onSelectNode,
  registry,
}: {
  componentId: string;
  selectedNodeId: NodeId;
  onSelectNode: (nodeId: NodeId) => void;
  registry: ComponentRegistry;
}) {
  const projectDocument = useEditorStore((state) => state.document);
  const definition = projectDocument.components?.[componentId];

  const componentDocument = useMemo(
    () =>
      definition
        ? createComponentDefinitionDocument(projectDocument, definition)
        : null,
    [projectDocument, definition]
  );

  const adapter = useMemo<DesignerAdapter | null>(() => {
    if (!definition || !componentDocument) return null;

    const rootId = definition.rootId;
    return {
      key: `component:${componentId}`,
      canvasSelector: "[data-editor-component-canvas]",
      nodeIdAttribute: "data-component-node-id",
      snapshot: {
        document: componentDocument,
        rootId,
        selectedNodeId,
        selectedNodeIds: [selectedNodeId],
      },
      read: () => {
        const state = useEditorStore.getState();
        const currentDefinition = state.document.components?.[componentId];
        if (!currentDefinition) {
          return {
            document: componentDocument,
            rootId,
            selectedNodeId,
            selectedNodeIds: [selectedNodeId],
          };
        }

        return {
          document: createComponentDefinitionDocument(
            state.document,
            currentDefinition
          ),
          rootId: currentDefinition.rootId,
          selectedNodeId,
          selectedNodeIds: [selectedNodeId],
        };
      },
      selectNode: (nodeId) => {
        if (nodeId) onSelectNode(nodeId);
      },
      insertNode: (parentId, insertIndex, node) => {
        const insertedId = useEditorStore
          .getState()
          .insertComponentDefinitionNode(
            componentId,
            parentId,
            insertIndex,
            node
          );
        if (insertedId) onSelectNode(insertedId);
        return insertedId;
      },
      moveNode: (nodeId, targetParentId, targetIndex) => {
        useEditorStore
          .getState()
          .moveComponentDefinitionNode(
            componentId,
            nodeId,
            targetParentId,
            targetIndex
          );
        onSelectNode(nodeId);
      },
      deleteNode: (nodeId) => {
        if (nodeId === rootId) return;
        useEditorStore
          .getState()
          .deleteComponentDefinitionNode(componentId, nodeId);
        onSelectNode(rootId);
      },
      canMoveNode: (nodeId) => nodeId !== rootId,
      canDeleteNode: (nodeId) => nodeId !== rootId,
    };
  }, [
    componentDocument,
    componentId,
    definition,
    onSelectNode,
    selectedNodeId,
  ]);

  return adapter ? <DesignerSurface adapter={adapter} registry={registry} /> : null;
}
