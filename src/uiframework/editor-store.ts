import { create } from "zustand";
import {
  applyDocumentCommand,
  type DocumentCommand,
} from "./core/commands";
import {
  createEmptyUiDocument,
  type Binding,
  type HandlerRef,
  type MethodRef,
  type ScopedMethodRef,
  type UiComponentDefinition,
  type NodeId,
  type UiDocument,
  type UiNode,
} from "./core/document";
import { getComponentDefinition } from "./registry/component-definitions";
import { createReusableComponentFromNode } from "./reusable-components";
import {
  createUniqueNodeName,
  validateNodeName,
} from "./core/node-name";

export type DragPreview = {
  type: string;
  props: Record<string, unknown>;
  componentDefinitionId?: string | undefined;
};

export type NewNode = {
  type: UiNode["type"];
  props?: Record<string, unknown>;
  componentDefinitionId?: string | undefined;
};

export type RenameNodeResult =
  | { ok: true }
  | { ok: false; error: string };

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
  renameNode: (nodeId: NodeId, name: string) => RenameNodeResult;

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

  setMethod: (
    nodeId: NodeId,
    method: string,
    script: MethodRef | null
  ) => void;

  createReusableComponent: (nodeId: NodeId) => string | null;
  updateComponentDefinition: (
    componentId: string,
    updater: (definition: UiComponentDefinition) => UiComponentDefinition
  ) => void;
  updateComponentDefinitionNode: (
    componentId: string,
    nodeId: NodeId,
    updater: (node: UiNode) => UiNode
  ) => void;
  setComponentDefinitionMethod: (
    componentId: string,
    methodName: string,
    method: ScopedMethodRef | null
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

  renameNode: (nodeId, value) => {
    let result: RenameNodeResult = {
      ok: false,
      error: "Node not found.",
    };

    set((state) => {
      const node = state.document.nodes[nodeId];
      if (!node) {
        return state;
      }

      const validation = validateNodeName(state.document, nodeId, value);
      if (!validation.ok) {
        result = validation;
        return state;
      }

      result = { ok: true };

      return {
        document: applyDocumentCommand(state.document, {
          type: "node.replace",
          node: {
            ...node,
            name: validation.name,
          },
        }),
      };
    });

    return result;
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

  setMethod: (nodeId, method, script) => {
    set((state) => ({
      document: applyDocumentCommand(state.document, {
        type: "node.setMethod",
        nodeId,
        method,
        script,
      }),
    }));
  },

  createReusableComponent: (nodeId) => {
    let componentId: string | null = null;

    set((state) => {
      try {
        const result = createReusableComponentFromNode(state.document, nodeId);
        componentId = result.componentId;
        return {
          document: result.document,
          selectedNodeId: result.instanceNodeId,
        };
      } catch (error) {
        console.error("Failed to create reusable component", error);
        return state;
      }
    });

    return componentId;
  },

  updateComponentDefinition: (componentId, updater) => {
    set((state) => {
      const current = state.document.components?.[componentId];
      if (!current) return state;

      return {
        document: {
          ...state.document,
          components: {
            ...(state.document.components ?? {}),
            [componentId]: updater(current),
          },
        },
      };
    });
  },

  updateComponentDefinitionNode: (componentId, nodeId, updater) => {
    set((state) => {
      const current = state.document.components?.[componentId];
      const node = current?.nodes[nodeId];
      if (!current || !node) return state;

      const nextDefinition = {
        ...current,
        nodes: {
          ...current.nodes,
          [nodeId]: updater(node),
        },
      };

      return {
        document: {
          ...state.document,
          components: {
            ...(state.document.components ?? {}),
            [componentId]: nextDefinition,
          },
        },
      };
    });
  },

  setComponentDefinitionMethod: (componentId, methodName, method) => {
    set((state) => {
      const current = state.document.components?.[componentId];
      if (!current) return state;

      const methods = { ...(current.methods ?? {}) };
      if (method) methods[methodName] = method;
      else delete methods[methodName];

      const nextDefinition: UiComponentDefinition = {
        ...current,
        methods: Object.keys(methods).length > 0 ? methods : undefined,
      };

      return {
        document: {
          ...state.document,
          components: {
            ...(state.document.components ?? {}),
            [componentId]: nextDefinition,
          },
        },
      };
    });
  },

  insertNode: (parentId, insertIndex, node) => {
    set((state) => {
      const parent = state.document.nodes[parentId];
      if (!parent) {
        return state;
      }

      const definition = getComponentDefinition(node.type);
      const id = crypto.randomUUID();
      const reusableName = node.componentDefinitionId
        ? state.document.components?.[node.componentDefinitionId]?.name
        : undefined;
      const name = createUniqueNodeName(
        state.document,
        reusableName ?? node.type
      );
      const newNode: UiNode = {
        id,
        name,
        type: node.type,
        componentDefinitionId: node.componentDefinitionId,
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

