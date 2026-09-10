import { create } from "zustand";
import {
  applyDocumentCommand,
  type DocumentCommand,
} from "./core/commands";
import {
  createEmptyUiDocument,
  createPageRootNode,
  getPage,
  type Binding,
  type HandlerRef,
  type MethodRef,
  type ScopedMethodRef,
  type UiComponentDefinition,
  type PageId,
  type NodeId,
  type UiDocument,
  type UiNode,
} from "./core/document";
import { getComponentDefinition } from "./registry/component-definitions";
import { setOptionalRecordEntry } from "./core/optional-record";
import {
  createProjectComponentRepository,
  wouldCreateComponentCycle,
} from "./component-repository";
import {
  createReusableComponentFromNode,
  createReusableComponentFromSelection,
  createComponentDefinitionDocument,
} from "./reusable-components";
import {
  createUniqueNodeName,
  validateNodeName,
} from "./core/node-name";
import { createPageDeletionPlan, withStartPage } from "./core/pages";

export type DragPreview = {
  type: string;
  props: Record<string, unknown>;
  componentDefinitionId?: string | undefined;
  label?: string | undefined;
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
  activePageId: PageId;
  selectedNodeId: NodeId | null;
  selectedNodeIds: NodeId[];
  document: UiDocument;

  dragPreview: DragPreview | null;
  dragX: number;
  dragY: number;
  draggedNodeId: NodeId | null;
  nodeDragCandidate: NodeDragCandidate | null;

  setActivePageId: (pageId: PageId) => void;
  setStartPage: (pageId: PageId) => void;
  addPage: (parentPageId?: PageId | undefined) => PageId | null;
  deletePage: (pageId: PageId) => boolean;
  setSelectedNodeId: (id: NodeId | null) => void;
  selectNode: (
    id: NodeId | null,
    options?: { toggle?: boolean; additive?: boolean }
  ) => void;
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
  createReusableComponentFromSelection: (nodeIds?: NodeId[]) => string | null;
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

  insertComponentDefinitionNode: (
    componentId: string,
    parentId: NodeId,
    insertIndex: number,
    node: NewNode
  ) => NodeId | null;
  deleteComponentDefinitionNode: (
    componentId: string,
    nodeId: NodeId
  ) => void;
  moveComponentDefinitionNode: (
    componentId: string,
    nodeId: NodeId,
    targetParentId: NodeId,
    targetIndex: number
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

const initialEditorDocument = createEmptyUiDocument();

function getActiveRootId(state: Pick<EditorState, "document" | "activePageId">) {
  return getPage(state.document, state.activePageId).rootId;
}

function applyActiveCommand(state: EditorState, command: DocumentCommand) {
  return applyDocumentCommand(state.document, command, getActiveRootId(state));
}

function createUniquePageName(document: UiDocument, parentPageId?: PageId) {
  const siblingNames = new Set(
    Object.values(document.pages)
      .filter((page) => page.parentPageId === parentPageId)
      .map((page) => page.name)
  );

  const base = parentPageId ? "SubPage" : "Page";
  let index = 1;
  while (siblingNames.has(`${base}${index}`)) index += 1;
  return `${base}${index}`;
}

export const useEditorStore = create<EditorState>((set) => ({
  activePageId: initialEditorDocument.startPageId,
  selectedNodeId: null,
  selectedNodeIds: [],
  document: initialEditorDocument,

  dragPreview: null,
  dragX: 0,
  dragY: 0,
  draggedNodeId: null,
  nodeDragCandidate: null,

  setActivePageId: (pageId) => {
    set((state) => {
      const page = state.document.pages[pageId];
      if (!page) return state;
      return {
        activePageId: pageId,
        selectedNodeId: page.rootId,
        selectedNodeIds: [page.rootId],
        draggedNodeId: null,
        nodeDragCandidate: null,
        dragPreview: null,
      };
    });
  },

  setStartPage: (pageId) => {
    set((state) => {
      if (!state.document.pages[pageId]) return state;
      return { document: withStartPage(state.document, pageId) };
    });
  },

  addPage: (parentPageId) => {
    let createdPageId: PageId | null = null;

    set((state) => {
      if (parentPageId && !state.document.pages[parentPageId]) return state;

      const name = createUniquePageName(state.document, parentPageId);
      const root = createPageRootNode(name);
      const pageId = crypto.randomUUID();
      createdPageId = pageId;

      return {
        document: {
          ...state.document,
          pages: {
            ...state.document.pages,
            [pageId]: {
              id: pageId,
              name,
              rootId: root.id,
              ...(parentPageId ? { parentPageId } : {}),
            },
          },
          nodes: {
            ...state.document.nodes,
            [root.id]: root,
          },
        },
        activePageId: pageId,
        selectedNodeId: root.id,
        selectedNodeIds: [root.id],
      };
    });

    return createdPageId;
  },

  deletePage: (pageId) => {
    let deleted = false;

    set((state) => {
      const plan = createPageDeletionPlan(state.document, pageId);
      if (!plan?.fallbackPageId) return state;

      const deletedPageIds = new Set(plan.pageIds);
      const deletedNodeIds = new Set(plan.nodeIds);
      const pages = { ...state.document.pages };
      const nodes = { ...state.document.nodes };

      for (const deletedPageId of plan.pageIds) delete pages[deletedPageId];
      for (const deletedNodeId of plan.nodeIds) delete nodes[deletedNodeId];

      const startPageId = deletedPageIds.has(state.document.startPageId)
        ? plan.fallbackPageId
        : state.document.startPageId;
      const startPage = pages[startPageId];
      const activePageId = deletedPageIds.has(state.activePageId)
        ? plan.fallbackPageId
        : state.activePageId;
      const activePage = pages[activePageId];

      if (!startPage || !activePage) return state;
      deleted = true;

      const activePageChanged = activePageId !== state.activePageId;
      const selectedNodeIds = activePageChanged
        ? [activePage.rootId]
        : state.selectedNodeIds.filter((id) => !deletedNodeIds.has(id) && !!nodes[id]);
      const selectedNodeId = activePageChanged
        ? activePage.rootId
        : state.selectedNodeId && nodes[state.selectedNodeId]
          ? state.selectedNodeId
          : selectedNodeIds.at(-1) ?? activePage.rootId;

      return {
        document: {
          ...state.document,
          pages,
          nodes,
          startPageId,
          rootId: startPage.rootId,
        },
        activePageId,
        selectedNodeId,
        selectedNodeIds:
          selectedNodeIds.length > 0 ? selectedNodeIds : [activePage.rootId],
        draggedNodeId: null,
        nodeDragCandidate: null,
        dragPreview: null,
      };
    });

    return deleted;
  },

  setSelectedNodeId: (id) => {
    set({
      selectedNodeId: id,
      selectedNodeIds: id ? [id] : [],
    });
  },

  selectNode: (id, options = {}) => {
    set((state) => {
      if (!id) {
        return { selectedNodeId: null, selectedNodeIds: [] };
      }

      if (!state.document.nodes[id]) return state;

      const { toggle = false, additive = false } = options;
      if (!toggle && !additive) {
        return { selectedNodeId: id, selectedNodeIds: [id] };
      }

      const selected = new Set(state.selectedNodeIds);
      if (toggle && selected.has(id)) {
        selected.delete(id);
      } else {
        selected.add(id);
      }

      const selectedNodeIds = Array.from(selected);
      return {
        selectedNodeIds,
        selectedNodeId: selected.has(id)
          ? id
          : selectedNodeIds.at(-1) ?? null,
      };
    });
  },

  setDocument: (document) => {
    const startPage = getPage(document, document.startPageId);
    set({
      document,
      activePageId: startPage.id,
      selectedNodeIds: [startPage.rootId],
      selectedNodeId: startPage.rootId,
      draggedNodeId: null,
      nodeDragCandidate: null,
      dragPreview: null,
    });
  },

  dispatch: (command) => {
    set((state) => {
      const document = applyActiveCommand(state, command);

      return {
        document,
        selectedNodeIds: state.selectedNodeIds.filter((id) => !!document.nodes[id]),
        selectedNodeId:
          state.selectedNodeId && document.nodes[state.selectedNodeId]
            ? state.selectedNodeId
            : state.selectedNodeIds.find((id) => !!document.nodes[id]) ?? null,
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

      const pageEntry = Object.values(state.document.pages).find(
        (page) => page.rootId === nodeId
      );
      const validation = validateNodeName(
        state.document,
        nodeId,
        value,
        getActiveRootId(state)
      );
      if (!validation.ok) {
        result = validation;
        return state;
      }

      if (
        pageEntry &&
        Object.values(state.document.pages).some(
          (page) =>
            page.id !== pageEntry.id &&
            page.parentPageId === pageEntry.parentPageId &&
            page.name === validation.name
        )
      ) {
        result = {
          ok: false,
          error: `“${validation.name}” is already used by a sibling page.`,
        };
        return state;
      }

      result = { ok: true };

      const renamedDocument = applyActiveCommand(state, {
        type: "node.replace",
        node: {
          ...node,
          name: validation.name,
        },
      });
      if (!pageEntry) {
        return { document: renamedDocument };
      }

      return {
        document: {
          ...renamedDocument,
          pages: {
            ...renamedDocument.pages,
            [pageEntry.id]: {
              ...pageEntry,
              name: validation.name,
            },
          },
        },
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
        document: applyActiveCommand(state, {
          type: "node.replace",
          node: updater(current),
        }),
      };
    });
  },

  setBinding: (nodeId, property, binding) => {
    set((state) => ({
      document: applyActiveCommand(state, {
        type: "node.setBinding",
        nodeId,
        property,
        binding,
      }),
    }));
  },

  setEvent: (nodeId, event, handler) => {
    set((state) => ({
      document: applyActiveCommand(state, {
        type: "node.setEvent",
        nodeId,
        event,
        handler,
      }),
    }));
  },

  setMethod: (nodeId, method, script) => {
    set((state) => ({
      document: applyActiveCommand(state, {
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
        const activeDocument = {
          ...state.document,
          rootId: getActiveRootId(state),
        };
        const result = createReusableComponentFromNode(activeDocument, nodeId);
        componentId = result.componentId;
        return {
          document: { ...result.document, rootId: state.document.rootId },
          selectedNodeId: result.instanceNodeId,
          selectedNodeIds: [result.instanceNodeId],
        };
      } catch (error) {
        console.error("Failed to create reusable component", error);
        return state;
      }
    });

    return componentId;
  },

  createReusableComponentFromSelection: (requestedNodeIds) => {
    let componentId: string | null = null;

    set((state) => {
      const nodeIds = requestedNodeIds ?? state.selectedNodeIds;
      try {
        const activeDocument = {
          ...state.document,
          rootId: getActiveRootId(state),
        };
        const result = createReusableComponentFromSelection(
          activeDocument,
          nodeIds
        );
        componentId = result.componentId;
        return {
          document: { ...result.document, rootId: state.document.rootId },
          selectedNodeId: result.instanceNodeId,
          selectedNodeIds: [result.instanceNodeId],
        };
      } catch (error) {
        console.error("Failed to create reusable component from selection", error);
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
        document: createProjectComponentRepository(state.document).upsert(
          updater(current)
        ),
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
        document: createProjectComponentRepository(state.document).upsert(
          nextDefinition
        ),
      };
    });
  },

  setComponentDefinitionMethod: (componentId, methodName, method) => {
    set((state) => {
      const current = state.document.components?.[componentId];
      if (!current) return state;

      const nextDefinition: UiComponentDefinition = {
        ...current,
        methods: setOptionalRecordEntry(current.methods, methodName, method),
      };

      return {
        document: createProjectComponentRepository(state.document).upsert(
          nextDefinition
        ),
      };
    });
  },

  insertComponentDefinitionNode: (componentId, parentId, insertIndex, node) => {
    let insertedId: NodeId | null = null;

    set((state) => {
      const definition = state.document.components?.[componentId];
      const parent = definition?.nodes[parentId];
      if (!definition || !parent) return state;

      const parentDefinition = getComponentDefinition(parent.type);
      if (!parentDefinition?.acceptsChildren) return state;

      if (
        node.componentDefinitionId &&
        wouldCreateComponentCycle(
          state.document,
          componentId,
          node.componentDefinitionId
        )
      ) {
        console.warn("Ignoring component insertion that would create a recursive component graph.");
        return state;
      }

      const syntheticDocument = createComponentDefinitionDocument(
        state.document,
        definition
      );
      const registeredDefinition = getComponentDefinition(node.type);
      const id = crypto.randomUUID();
      const reusableName = node.componentDefinitionId
        ? state.document.components?.[node.componentDefinitionId]?.name
        : undefined;
      const name = createUniqueNodeName(
        syntheticDocument,
        reusableName ?? node.type,
        definition.rootId
      );
      const newNode: UiNode = {
        id,
        name,
        type: node.type,
        componentDefinitionId: node.componentDefinitionId,
        props: { ...(node.props ?? {}) },
        children: registeredDefinition?.acceptsChildren ? [] : undefined,
      };
      const updatedSynthetic = applyDocumentCommand(
        syntheticDocument,
        {
          type: "node.insert",
          parentId,
          insertIndex,
          node: newNode,
        },
        definition.rootId
      );

      if (!updatedSynthetic.nodes[id]) return state;
      insertedId = id;

      return {
        document: createProjectComponentRepository(state.document).upsert({
          ...definition,
          nodes: updatedSynthetic.nodes,
        }),
        dragPreview: null,
        draggedNodeId: null,
        nodeDragCandidate: null,
      };
    });

    return insertedId;
  },

  deleteComponentDefinitionNode: (componentId, nodeId) => {
    set((state) => {
      const definition = state.document.components?.[componentId];
      if (!definition || nodeId === definition.rootId || !definition.nodes[nodeId]) {
        return state;
      }

      const syntheticDocument = createComponentDefinitionDocument(
        state.document,
        definition
      );
      const updatedSynthetic = applyDocumentCommand(
        syntheticDocument,
        { type: "node.delete", nodeId },
        definition.rootId
      );

      if (updatedSynthetic.nodes === syntheticDocument.nodes) return state;

      return {
        document: createProjectComponentRepository(state.document).upsert({
          ...definition,
          nodes: updatedSynthetic.nodes,
        }),
      };
    });
  },

  moveComponentDefinitionNode: (
    componentId,
    nodeId,
    targetParentId,
    targetIndex
  ) => {
    set((state) => {
      const definition = state.document.components?.[componentId];
      if (!definition) return state;

      const targetParent = definition.nodes[targetParentId];
      const targetDefinition = targetParent
        ? getComponentDefinition(targetParent.type)
        : undefined;
      if (!targetParent || !targetDefinition?.acceptsChildren) return state;

      const syntheticDocument = createComponentDefinitionDocument(
        state.document,
        definition
      );
      const updatedSynthetic = applyDocumentCommand(
        syntheticDocument,
        {
          type: "node.move",
          nodeId,
          targetParentId,
          targetIndex,
        },
        definition.rootId
      );

      return {
        document: createProjectComponentRepository(state.document).upsert({
          ...definition,
          nodes: updatedSynthetic.nodes,
        }),
        draggedNodeId: null,
        nodeDragCandidate: null,
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
        reusableName ?? node.type,
        getActiveRootId(state)
      );
      const newNode: UiNode = {
        id,
        name,
        type: node.type,
        componentDefinitionId: node.componentDefinitionId,
        props: { ...(node.props ?? {}) },
        children: definition?.acceptsChildren ? [] : undefined,
      };

      const document = applyActiveCommand(state, {
        type: "node.insert",
        parentId,
        insertIndex,
        node: newNode,
      });

      return {
        document,
        selectedNodeId: document.nodes[id] ? id : state.selectedNodeId,
        selectedNodeIds: document.nodes[id] ? [id] : state.selectedNodeIds,
        dragPreview: null,
        draggedNodeId: null,
        nodeDragCandidate: null,
      };
    });
  },

  deleteNode: (id) => {
    set((state) => {
      const document = applyActiveCommand(state, {
        type: "node.delete",
        nodeId: id,
      });

      return {
        document,
        selectedNodeIds: state.selectedNodeIds.filter((nodeId) => !!document.nodes[nodeId]),
        selectedNodeId:
          state.selectedNodeId && document.nodes[state.selectedNodeId]
            ? state.selectedNodeId
            : state.selectedNodeIds.find((nodeId) => !!document.nodes[nodeId]) ?? null,
      };
    });
  },

  moveNodeUp: (nodeId) => {
    set((state) => ({
      document: applyActiveCommand(state, {
        type: "node.moveBy",
        nodeId,
        offset: -1,
      }),
    }));
  },

  moveNodeDown: (nodeId) => {
    set((state) => ({
      document: applyActiveCommand(state, {
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
      document: applyActiveCommand(state, {
        type: "node.move",
        nodeId,
        targetParentId,
        targetIndex,
      }),
      draggedNodeId: null,
      nodeDragCandidate: null,
      selectedNodeId: nodeId,
      selectedNodeIds: [nodeId],
    }));
  },
}));

