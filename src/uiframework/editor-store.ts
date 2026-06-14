import { create } from "zustand";
import type { UiNode, UiTree } from "./Renderer";

export type NodeId = string;

export type DragPreview = {
  type: string;
  props: Record<string, unknown>;
};

export type NewNode = Pick<
  UiNode,
  "type" | "props"
>;

type EditorState = {
  //
  // Selection
  //
  selectedNodeId: NodeId | null;

  //
  // Document
  //
  nodes: UiTree;

  //
  // Drag Preview
  //
  dragPreview: DragPreview | null;
  dragX: number;
  dragY: number;

  //
  // Selection API
  //
  setSelectedNodeId: (
    id: NodeId | null
  ) => void;

  //
  // Document API
  //
  setNodes: (
    nodes: UiTree
  ) => void;

  updateNode: (
    id: NodeId,
    updater: (node: UiNode) => UiNode
  ) => void;

  addNodeToParent: (
    parentId: NodeId,
    node: NewNode
  ) => void;

  //
  // Drag API
  //
  startComponentDrag: (
    preview: DragPreview
  ) => void;

  moveDrag: (
    x: number,
    y: number
  ) => void;

  endComponentDrag: () => void;
};

export const useEditorStore =
  create<EditorState>((set) => ({
    //
    // Selection
    //
    selectedNodeId: null,

    //
    // Document
    //
    nodes: {},

    //
    // Drag
    //
    dragPreview: null,
    dragX: 0,
    dragY: 0,

    //
    // Selection API
    //
    setSelectedNodeId: (id) =>
      set({
        selectedNodeId: id,
      }),

    //
    // Document API
    //
    setNodes: (nodes) =>
      set({
        nodes,
      }),

    updateNode: (
      id,
      updater
    ) =>
      set((state) => {
        const node =
          state.nodes[id];

        if (!node) {
          return state;
        }

        return {
          nodes: {
            ...state.nodes,
            [id]: updater(node),
          },
        };
      }),

    addNodeToParent: (
      parentId,
      node
    ) =>
      set((state) => {
        const parent =
          state.nodes[parentId];

        if (!parent) {
          return state;
        }

        const id =
          crypto.randomUUID();

        const newNode: UiNode = {
          id,
          type: node.type,
          props: node.props,
          children:
            node.type ===
            "Container"
              ? []
              : undefined,
        };

        return {
          nodes: {
            ...state.nodes,

            [id]: newNode,

            [parentId]: {
              ...parent,
              children: [
                ...(parent.children ??
                  []),
                id,
              ],
            },
          },

          selectedNodeId: id,
          dragPreview: null,
        };
      }),

    //
    // Drag API
    //
    startComponentDrag: (
      preview
    ) =>
      set({
        dragPreview: preview,
      }),

    moveDrag: (
      x,
      y
    ) =>
      set({
        dragX: x,
        dragY: y,
      }),

    endComponentDrag: () =>
      set({
        dragPreview: null,
      }),
  }));