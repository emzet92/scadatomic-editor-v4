import { create } from "zustand";
import type { UiNode, UiTree } from "./Renderer";

export type NodeId = string;

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
  dragPreview: string | null;
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

  //
  // Drag API
  //
  startComponentDrag: (
    type: string
  ) => void;

  moveDrag: (
    x: number,
    y: number
  ) => void;

  endComponentDrag: () => void;
};

export const useEditorStore =
  create<EditorState>((set) => ({
    selectedNodeId: null,

    nodes: {},

    dragPreview: null,
    dragX: 0,
    dragY: 0,

    setSelectedNodeId: (id) =>
      set({
        selectedNodeId: id,
      }),

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

    startComponentDrag: (
      type
    ) =>
      set({
        dragPreview: type,
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