import { useMemo } from "react";
import { getPage } from "../core/document";
import { useEditorStore } from "../editor-store";
import type { ComponentRegistry } from "../registry/editor-registry";
import { DesignerSurface } from "./DesignerSurface";
import type { DesignerAdapter } from "./designer-adapter";

export function PageDesignerSurface({
  registry,
}: {
  registry: ComponentRegistry;
}) {
  const document = useEditorStore((state) => state.document);
  const activePageId = useEditorStore((state) => state.activePageId);
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const selectedNodeIds = useEditorStore((state) => state.selectedNodeIds);

  const activeRootId = getPage(document, activePageId).rootId;
  const activeDocument = useMemo(
    () => ({ ...document, rootId: activeRootId }),
    [document, activeRootId]
  );

  const adapter = useMemo<DesignerAdapter>(
    () => ({
      key: `page:${activePageId}`,
      canvasSelector: "[data-editor-canvas]",
      nodeIdAttribute: "data-node-id",
      snapshot: {
        document: activeDocument,
        rootId: activeRootId,
        selectedNodeId,
        selectedNodeIds,
      },
      read: () => {
        const state = useEditorStore.getState();
        const rootId = getPage(state.document, state.activePageId).rootId;
        return {
          document: { ...state.document, rootId },
          rootId,
          selectedNodeId: state.selectedNodeId,
          selectedNodeIds: state.selectedNodeIds,
        };
      },
      selectNode: (nodeId, options) => {
        useEditorStore.getState().selectNode(nodeId, options);
      },
      insertNode: (parentId, insertIndex, node) => {
        const state = useEditorStore.getState();
        state.insertNode(parentId, insertIndex, node);
        return useEditorStore.getState().selectedNodeId;
      },
      moveNode: (nodeId, targetParentId, targetIndex) => {
        useEditorStore
          .getState()
          .moveNode(nodeId, targetParentId, targetIndex);
      },
      deleteNode: (nodeId) => {
        useEditorStore.getState().deleteNode(nodeId);
      },
      canMoveNode: (nodeId) => nodeId !== activeRootId,
      canDeleteNode: (nodeId) => nodeId !== activeRootId,
    }),
    [
      activeDocument,
      activePageId,
      activeRootId,
      selectedNodeId,
      selectedNodeIds,
    ]
  );

  return <DesignerSurface adapter={adapter} registry={registry} />;
}
