import type { NodeId, UiDocument } from "../core/document";
import type { NewNode } from "../editor-store";

export type DesignerSelectionOptions = {
  toggle?: boolean;
  additive?: boolean;
};

export type DesignerAdapterSnapshot = {
  document: UiDocument;
  rootId: NodeId;
  selectedNodeId: NodeId | null;
  selectedNodeIds: readonly NodeId[];
};

/**
 * Storage/navigation boundary for the visual designer engine.
 *
 * DesignerSurface owns all pointer, geometry, drag/drop and overlay behavior.
 * A DesignerAdapter only tells it which tree is being edited and how mutations
 * should be persisted.
 */
export type DesignerAdapter = {
  key: string;
  canvasSelector: string;
  nodeIdAttribute: string;
  snapshot: DesignerAdapterSnapshot;
  read: () => DesignerAdapterSnapshot;
  selectNode: (
    nodeId: NodeId | null,
    options?: DesignerSelectionOptions
  ) => void;
  insertNode: (
    parentId: NodeId,
    insertIndex: number,
    node: NewNode
  ) => NodeId | null;
  moveNode: (
    nodeId: NodeId,
    targetParentId: NodeId,
    targetIndex: number
  ) => void;
  deleteNode: (nodeId: NodeId) => void;
  canMoveNode: (nodeId: NodeId) => boolean;
  canDeleteNode: (nodeId: NodeId) => boolean;
};
