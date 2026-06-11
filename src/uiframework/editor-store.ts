import { create } from "zustand";

export type NodeId = string;

type EditorState = {
  selectedNodeId: NodeId | null;

  setSelectedNodeId: (
    id: NodeId | null
  ) => void;
};

export const useEditorStore =
  create<EditorState>((set) => ({
    selectedNodeId: null,

    setSelectedNodeId: (id) =>
      set({
        selectedNodeId: id,
      }),
  }));