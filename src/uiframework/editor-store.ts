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

  insertNode: (
    parentId: NodeId,
    insertIndex: number,
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
  deleteNode: (
    id: NodeId
  ) => void;

  moveNodeUp: (
    nodeId: NodeId
  ) => void;

  moveNodeDown: (
    nodeId: NodeId
  ) => void;

  //
  // Node Drag
  //
  draggedNodeId: NodeId | null;

  startNodeDrag: (
    nodeId: NodeId
  ) => void;

  endNodeDrag: () => void;

  moveNode: (
    nodeId: NodeId,
    targetParentId: NodeId,
    targetIndex: number
  ) => void;
  resizingNodeId: NodeId | null;

  startResize: (
    nodeId: NodeId
  ) => void;

  endResize: () => void;
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
    draggedNodeId: null,
    resizingNodeId: null,
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

    insertNode: (
      parentId,
      insertIndex,
      node
    ) =>
      set((state) => {
        const parent = state.nodes[parentId];

        if (!parent) {
          return state;
        }

        const id = crypto.randomUUID();

        const newNode: UiNode = {
          id,
          type: node.type,
          props: {
            ...node.props,
          },
          children:
            node.type === "Container"
              ? []
              : undefined,
        };

        const children = parent.children ?? [];

        const safeInsertIndex = Math.max(
          0,
          Math.min(insertIndex, children.length)
        );

        const nextChildren = [
          ...children.slice(0, safeInsertIndex),
          id,
          ...children.slice(safeInsertIndex),
        ];

        console.log(
          "PARENT AFTER INSERT",
          {
            parentId,
            children: nextChildren,
          }
        );

        return {
          nodes: {
            ...state.nodes,

            [id]: newNode,

            [parentId]: {
              ...parent,
              children: nextChildren,
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

    deleteNode: (id) =>
      set((state) => {
        if (id === "root") {
          return state;
        }

        const node =
          state.nodes[id];

        if (!node) {
          return state;
        }

        const nextNodes = {
          ...state.nodes,
        };

        function removeSubtree(
          nodeId: string
        ) {
          const current =
            nextNodes[nodeId];

          if (!current) {
            return;
          }

          for (const childId of current.children ??
            []) {
            removeSubtree(childId);
          }

          delete nextNodes[nodeId];
        }

        const parent =
          Object.values(nextNodes).find(
            (candidate) =>
              candidate.children?.includes(
                id
              )
          );

        if (!parent) {
          return state;
        }

        removeSubtree(id);

        nextNodes[parent.id] = {
          ...parent,
          children:
            parent.children?.filter(
              (childId) =>
                childId !== id
            ) ?? [],
        };

        return {
          nodes: nextNodes,

          selectedNodeId:
            state.selectedNodeId === id
              ? null
              : state.selectedNodeId,
        };
      }),
    moveNodeUp: (nodeId) =>
      set((state) => {
        const parent =
          Object.values(
            state.nodes
          ).find((node) =>
            node.children?.includes(
              nodeId
            )
          );

        if (
          !parent ||
          !parent.children
        ) {
          return state;
        }

        const index =
          parent.children.indexOf(
            nodeId
          );

        if (index <= 0) {
          return state;
        }

        const nextChildren = [
          ...parent.children,
        ];

        [
          nextChildren[index - 1],
          nextChildren[index],
        ] = [
            nextChildren[index],
            nextChildren[index - 1],
          ];

        return {
          nodes: {
            ...state.nodes,
            [parent.id]: {
              ...parent,
              children:
                nextChildren,
            },
          },
        };
      }),

    moveNodeDown: (nodeId) =>
      set((state) => {
        const parent =
          Object.values(
            state.nodes
          ).find((node) =>
            node.children?.includes(
              nodeId
            )
          );

        if (
          !parent ||
          !parent.children
        ) {
          return state;
        }

        const index =
          parent.children.indexOf(
            nodeId
          );

        if (
          index === -1 ||
          index >=
          parent.children.length -
          1
        ) {
          return state;
        }

        const nextChildren = [
          ...parent.children,
        ];

        [
          nextChildren[index],
          nextChildren[index + 1],
        ] = [
            nextChildren[index + 1],
            nextChildren[index],
          ];

        return {
          nodes: {
            ...state.nodes,
            [parent.id]: {
              ...parent,
              children:
                nextChildren,
            },
          },
        };
      }),
    startNodeDrag: (
      nodeId
    ) =>
      set({
        draggedNodeId: nodeId,
      }),

    endNodeDrag: () =>
      set({
        draggedNodeId: null,
      }),
    moveNode: (
      nodeId,
      targetParentId,
      targetIndex
    ) =>
      set((state) => {
        if (nodeId === "root") {
          return state;
        }

        const node = state.nodes[nodeId];
        const targetParent =
          state.nodes[targetParentId];

        if (!node || !targetParent) {
          return state;
        }

        function isDescendant(
          parentId: string,
          childId: string
        ): boolean {
          const parent = state.nodes[parentId];

          if (!parent) {
            return false;
          }

          for (const id of parent.children ?? []) {
            if (id === childId) {
              return true;
            }

            if (isDescendant(id, childId)) {
              return true;
            }
          }

          return false;
        }

        if (
          nodeId === targetParentId ||
          isDescendant(nodeId, targetParentId)
        ) {
          return state;
        }

        const sourceParent =
          Object.values(state.nodes).find(
            (candidate) =>
              candidate.children?.includes(nodeId)
          );

        if (!sourceParent || !sourceParent.children) {
          return state;
        }

        const nextNodes = {
          ...state.nodes,
        };

        const originalIndex =
          sourceParent.children.indexOf(nodeId);

        const sourceChildren =
          sourceParent.children.filter(
            (id) => id !== nodeId
          );

        nextNodes[sourceParent.id] = {
          ...sourceParent,
          children: sourceChildren,
        };

        const currentTargetParent =
          nextNodes[targetParentId];

        const targetChildren =
          currentTargetParent.children ?? [];

        const adjustedIndex =
          sourceParent.id === targetParentId &&
            targetIndex > originalIndex
            ? targetIndex - 1
            : targetIndex;

        const safeIndex = Math.max(
          0,
          Math.min(
            adjustedIndex,
            targetChildren.length
          )
        );

        const nextTargetChildren = [
          ...targetChildren.slice(0, safeIndex),
          nodeId,
          ...targetChildren.slice(safeIndex),
        ];

        nextNodes[targetParentId] = {
          ...currentTargetParent,
          children: nextTargetChildren,
        };

        return {
          nodes: nextNodes,
          draggedNodeId: null,
          selectedNodeId: nodeId,
        };
      }),
    startResize: (
      nodeId
    ) =>
      set({
        resizingNodeId: nodeId,
      }),

    endResize: () =>
      set({
        resizingNodeId: null,
      }),
  }));