import { useMemo } from "react";
import { buildDocumentIndex } from "../core/document-index";
import { collectModalNodeIds } from "../core/modals";
import { canAcceptManualChildren } from "../repeat/RepeatBehavior";
import { useEditorStore } from "../editor-store";
import type { ComponentRegistry } from "../registry/editor-registry";
import { DesignerSurface } from "./DesignerSurface";
import type { DesignerAdapter } from "./designer-adapter";

export function ModalDesignerSurface({ registry }: { registry: ComponentRegistry }) {
  const document = useEditorStore((state) => state.document);
  const activeModalId = useEditorStore((state) => state.activeModalId);
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const selectedNodeIds = useEditorStore((state) => state.selectedNodeIds);
  const modal = activeModalId ? document.modals?.[activeModalId] : undefined;

  const ownedNodeIds = useMemo(
    () => new Set(modal ? collectModalNodeIds(document, modal.id) : []),
    [document, modal]
  );
  const index = useMemo(
    () => (modal ? buildDocumentIndex(document, modal.rootId) : null),
    [document, modal]
  );

  const adapter = useMemo<DesignerAdapter | null>(() => {
    if (!modal || !index) return null;
    return {
      key: `modal:${modal.id}`,
      canvasSelector: "[data-editor-canvas]",
      nodeIdAttribute: "data-node-id",
      snapshot: {
        document: { ...document, rootId: modal.rootId },
        rootId: modal.rootId,
        selectedNodeId,
        selectedNodeIds,
      },
      read: () => {
        const state = useEditorStore.getState();
        const current = state.activeModalId
          ? state.document.modals?.[state.activeModalId]
          : undefined;
        const rootId = current?.rootId ?? modal.rootId;
        return {
          document: { ...state.document, rootId },
          rootId,
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
        useEditorStore.getState().insertNode(parentId, insertIndex, node);
        return useEditorStore.getState().selectedNodeId;
      },
      moveNode: (nodeId, targetParentId, targetIndex) => {
        if (!ownedNodeIds.has(nodeId) || !ownedNodeIds.has(targetParentId)) return;
        useEditorStore.getState().moveNode(nodeId, targetParentId, targetIndex);
      },
      deleteNode: (nodeId) => {
        if (!ownedNodeIds.has(nodeId)) return;
        useEditorStore.getState().deleteNode(nodeId);
      },
      duplicateNode: (nodeId) => {
        if (!ownedNodeIds.has(nodeId) || nodeId === modal.rootId) return null;
        return useEditorStore.getState().duplicateNode(nodeId);
      },
      updateNodeProps: (nodeId, patch) => {
        if (!ownedNodeIds.has(nodeId)) return;
        useEditorStore.getState().updateNode(nodeId, (current) => ({
          ...current,
          props: { ...(current.props ?? {}), ...patch },
        }));
      },
      canMoveNode: (nodeId) => ownedNodeIds.has(nodeId) && nodeId !== modal.rootId,
      canDeleteNode: (nodeId) => ownedNodeIds.has(nodeId) && nodeId !== modal.rootId,
      canDuplicateNode: (nodeId) => {
        if (!ownedNodeIds.has(nodeId) || nodeId === modal.rootId) return false;
        const parentId = index.parentById.get(nodeId);
        const parent = parentId ? document.nodes[parentId] : undefined;
        return !!parent && canAcceptManualChildren(parent);
      },
    };
  }, [document, index, modal, ownedNodeIds, selectedNodeId, selectedNodeIds]);

  return adapter ? <DesignerSurface adapter={adapter} registry={registry} /> : null;
}
