import { create } from "zustand";
import {
  applyDocumentCommand,
  type DocumentCommand,
} from "./core/commands";
import {
  createEmptyUiDocument,
  type Binding,
  type HandlerRef,
  type NodeId,
  type UiDocument,
  type UiNode,
} from "./core/document";
import { getComponentDefinition } from "./registry/component-definitions";

export type DragPreview = {
  type: string;
  props: Record<string, unknown>;
};

export type NewNode = {
  type: UiNode["type"];
  props?: Record<string, unknown>;
};

type NodeDragCandidate = {
  nodeId: NodeId;
  startX: number;
  startY: number;
};

type EditorState = {
  selectedNodeId: NodeId | null;
  document: UiDocument;

  dragPreview: DragPreview | null;
  dragX: number;
  dragY: number;
  draggedNodeId: NodeId | null;
  nodeDragCandidate: NodeDragCandidate | null;

  setSelectedNodeId: (id: NodeId | null) => void;
  setDocument: (document: UiDocument) => void;
  dispatch: (command: DocumentCommand) => void;

  updateNode: (
    id: NodeId,
    updater: (node: UiNode) => UiNode
  ) => void;

  setBinding: (
    nodeId: NodeId,
    property: string,
    binding: Binding | null
  ) => void;

  setEvent: (
    nodeId: NodeId,
    event: string,
    handler: HandlerRef | null
  ) => void;

  insertNode: (
    parentId: NodeId,
    insertIndex: number,
    node: NewNode
  ) => void;

  deleteNode: (id: NodeId) => void;
  moveNodeUp: (nodeId: NodeId) => void;
  moveNodeDown: (nodeId: NodeId) => void;

  startComponentDrag: (preview: DragPreview) => void;
  moveDrag: (x: number, y: number) => void;
  endComponentDrag: () => void;

  startNodeDragCandidate: (
    nodeId: NodeId,
    x: number,
    y: number
  ) => void;
  endNodeDrag: () => void;

  moveNode: (
    nodeId: NodeId,
    targetParentId: NodeId,
    targetIndex: number
  ) => void;
};

const NODE_DRAG_THRESHOLD_PX = 4;

export const useEditorStore = create<EditorState>((set) => ({
  selectedNodeId: null,
  document: createEmptyUiDocument(),

  dragPreview: null,
  dragX: 0,
  dragY: 0,
  draggedNodeId: null,
  nodeDragCandidate: null,

  setSelectedNodeId: (id) => {
    set({ selectedNodeId: id });
  },

  setDocument: (document) => {
    set((state) => ({
      document,
      selectedNodeId:
        state.selectedNodeId && document.nodes[state.selectedNodeId]
          ? state.selectedNodeId
          : null,
      draggedNodeId: null,
      nodeDragCandidate: null,
      dragPreview: null,
    }));
  },

  dispatch: (command) => {
    set((state) => {
      const document = applyDocumentCommand(state.document, command);

      return {
        document,
        selectedNodeId:
          state.selectedNodeId && document.nodes[state.selectedNodeId]
            ? state.selectedNodeId
            : null,
      };
    });
  },

  updateNode: (id, updater) => {
    set((state) => {
      const current = state.document.nodes[id];
      if (!current) {
        return state;
      }

      return {
        document: applyDocumentCommand(state.document, {
          type: "node.replace",
          node: updater(current),
        }),
      };
    });
  },

  setBinding: (nodeId, property, binding) => {
    set((state) => ({
      document: applyDocumentCommand(state.document, {
        type: "node.setBinding",
        nodeId,
        property,
        binding,
      }),
    }));
  },

  setEvent: (nodeId, event, handler) => {
    set((state) => ({
      document: applyDocumentCommand(state.document, {
        type: "node.setEvent",
        nodeId,
        event,
        handler,
      }),
    }));
  },

  insertNode: (parentId, insertIndex, node) => {
    set((state) => {
      const parent = state.document.nodes[parentId];
      if (!parent) {
        return state;
      }

      const definition = getComponentDefinition(node.type);
      const id = crypto.randomUUID();
      const newNode: UiNode = {
        id,
        type: node.type,
        props: { ...(node.props ?? {}) },
        children: definition?.acceptsChildren ? [] : undefined,
      };

      const document = applyDocumentCommand(state.document, {
        type: "node.insert",
        parentId,
        insertIndex,
        node: newNode,
      });

      return {
        document,
        selectedNodeId: document.nodes[id] ? id : state.selectedNodeId,
        dragPreview: null,
        draggedNodeId: null,
        nodeDragCandidate: null,
      };
    });
  },

  deleteNode: (id) => {
    set((state) => {
      const document = applyDocumentCommand(state.document, {
        type: "node.delete",
        nodeId: id,
      });

      return {
        document,
        selectedNodeId:
          state.selectedNodeId && document.nodes[state.selectedNodeId]
            ? state.selectedNodeId
            : null,
      };
    });
  },

  moveNodeUp: (nodeId) => {
    set((state) => ({
      document: applyDocumentCommand(state.document, {
        type: "node.moveBy",
        nodeId,
        offset: -1,
      }),
    }));
  },

  moveNodeDown: (nodeId) => {
    set((state) => ({
      document: applyDocumentCommand(state.document, {
        type: "node.moveBy",
        nodeId,
        offset: 1,
      }),
    }));
  },

  startComponentDrag: (preview) => {
    set({
      dragPreview: preview,
      draggedNodeId: null,
      nodeDragCandidate: null,
    });
  },

  moveDrag: (x, y) => {
    set((state) => {
      const candidate = state.nodeDragCandidate;
      const shouldStartNodeDrag =
        !!candidate &&
        Math.hypot(x - candidate.startX, y - candidate.startY) >=
          NODE_DRAG_THRESHOLD_PX;

      return {
        dragX: x,
        dragY: y,
        draggedNodeId: shouldStartNodeDrag
          ? candidate.nodeId
          : state.draggedNodeId,
        nodeDragCandidate: shouldStartNodeDrag
          ? null
          : state.nodeDragCandidate,
      };
    });
  },

  endComponentDrag: () => {
    set({ dragPreview: null });
  },

  startNodeDragCandidate: (nodeId, x, y) => {
    set({
      nodeDragCandidate: {
        nodeId,
        startX: x,
        startY: y,
      },
      dragX: x,
      dragY: y,
    });
  },

  endNodeDrag: () => {
    set({
      draggedNodeId: null,
      nodeDragCandidate: null,
    });
  },

  moveNode: (nodeId, targetParentId, targetIndex) => {
    set((state) => ({
      document: applyDocumentCommand(state.document, {
        type: "node.move",
        nodeId,
        targetParentId,
        targetIndex,
      }),
      draggedNodeId: null,
      nodeDragCandidate: null,
      selectedNodeId: nodeId,
    }));
  },
}));
