import { useMemo } from "react";
import { getPage } from "../core/document";
import { createPageRenderDocument } from "../core/page-layouts";
import { collectPageNodeIds } from "../core/pages";
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

  const activePage = getPage(document, activePageId);
  const renderDocument = useMemo(
    () => createPageRenderDocument(document, activePage.id),
    [document, activePage.id]
  );
  const ownedNodeIds = useMemo(
    () => new Set(collectPageNodeIds(document, [activePage.id])),
    [document, activePage.id]
  );

  const adapter = useMemo<DesignerAdapter>(
    () => ({
      key: `page:${activePage.id}:${activePage.layoutId ?? "no-layout"}`,
      canvasSelector: "[data-editor-canvas]",
      nodeIdAttribute: "data-node-id",
      snapshot: {
        document: renderDocument,
        rootId: renderDocument.rootId,
        selectedNodeId,
        selectedNodeIds,
      },
      read: () => {
        const state = useEditorStore.getState();
        const page = getPage(state.document, state.activePageId);
        const composed = createPageRenderDocument(state.document, page.id);
        return {
          document: composed,
          rootId: composed.rootId,
          selectedNodeId: state.selectedNodeId,
          selectedNodeIds: state.selectedNodeIds,
        };
      },
      selectNode: (nodeId, options) => {
        if (nodeId && !ownedNodeIds.has(nodeId)) return;
        useEditorStore.getState().selectNode(nodeId, options);
      },
      insertNode: (parentId, insertIndex, node) => {
        if (!ownedNodeIds.has(parentId)) return null;
        const state = useEditorStore.getState();
        state.insertNode(parentId, insertIndex, node);
        return useEditorStore.getState().selectedNodeId;
      },
      moveNode: (nodeId, targetParentId, targetIndex) => {
        if (!ownedNodeIds.has(nodeId) || !ownedNodeIds.has(targetParentId)) return;
        useEditorStore
          .getState()
          .moveNode(nodeId, targetParentId, targetIndex);
      },
      deleteNode: (nodeId) => {
        if (!ownedNodeIds.has(nodeId)) return;
        useEditorStore.getState().deleteNode(nodeId);
      },
      canMoveNode: (nodeId) =>
        ownedNodeIds.has(nodeId) && nodeId !== activePage.rootId,
      canDeleteNode: (nodeId) =>
        ownedNodeIds.has(nodeId) && nodeId !== activePage.rootId,
    }),
    [
      activePage.id,
      activePage.layoutId,
      activePage.rootId,
      ownedNodeIds,
      renderDocument,
      selectedNodeId,
      selectedNodeIds,
    ]
  );

  return <DesignerSurface adapter={adapter} registry={registry} />;
}
