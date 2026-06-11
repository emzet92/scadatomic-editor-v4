import { create } from "zustand";
import type { UiNode, UiTree } from "./Renderer";

export type NodeId = string;

type EditorState = {
  selectedNodeId: NodeId | null;

  nodes: UiTree;

  setSelectedNodeId: (
    id: NodeId | null
  ) => void;

  setNodes: (
    nodes: UiTree
  ) => void;

  updateNode: (
    id: NodeId,
    updater: (node: UiNode) => UiNode
  ) => void;
};

export const useEditorStore =
  create<EditorState>((set) => ({
    selectedNodeId: null,

    nodes: {},

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
  }));