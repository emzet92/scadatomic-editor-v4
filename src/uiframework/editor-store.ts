import { create } from "zustand";
import {
  applyDocumentCommand,
  type DocumentCommand,
} from "./core/commands";
import {
  createEmptyUiDocument,
  createPageLayoutNodes,
  createPageRootNode,
  createModalRootNode,
  getPage,
  getPageKind,
  type Binding,
  type HandlerRef,
  type MethodRef,
  type ScopedMethodRef,
  type UiComponentDefinition,
  type PageId,
  type ModalId,
  type NodeId,
  type UiDocument,
  type UiNode,
  type PageKind,
} from "./core/document";
import { setOptionalRecordEntry } from "./core/optional-record";
import { createProjectComponentRepository } from "./component-repository";
import {
  createReusableComponentFromNode,
  createReusableComponentFromSelection,
  createComponentDefinitionDocument,
} from "./reusable-components";
import { validateNodeName } from "./core/node-name";
import { createPageDeletionPlan, withStartPage } from "./core/pages";
import { buildDocumentIndex } from "./core/document-index";
import {
  deleteNodeFromTree,
  duplicateNodeInTree,
  insertNodeIntoTree,
  moveNodeByInTree,
  moveNodeInTree,
  updateNodeInTree,
  type NodeInsertDraft,
  type NodeTreeEditingContext,
} from "./editing/node-tree-editor";
import type { ProjectData } from "./data/tags/TagDefinition";
import type { TagRuntimeWriteResult } from "./data/runtime/TagRuntime";
import type { ReactiveEventHandlerBinding } from "../reactivity";
import { replaceDesignerTagData, writeDesignerTagValue } from "./data/tags/designer-tag-store";
import {
  createColorTokenRef,
  createEmptyDesignSystem,
  createStarterColorTokens,
  type ColorToken,
  type ColorTokenId,
  type DesignThemeId,
  type SemanticColorTokenId,
} from "./design-system/colors";
import { detachColorTokenFromDocument } from "./design-system/document-colors";
import {
  createStarterTypographyTokens,
  typographyTokenToStyle,
  type TypographyToken,
  type TypographyTokenId,
} from "./design-system/typography";
import { detachTypographyTokenFromDocument } from "./design-system/document-typography";
import {
  createStarterSpacingTokens,
  type SpacingToken,
  type SpacingTokenId,
} from "./design-system/spacing";
import { detachSpacingTokenFromDocument } from "./design-system/document-spacing";
import {
  createStarterRadiusTokens,
  type RadiusToken,
  type RadiusTokenId,
} from "./design-system/radius";
import { detachRadiusTokenFromDocument } from "./design-system/document-radius";
import {
  createStarterShadowTokens,
  type ShadowStyle,
  type ShadowToken,
  type ShadowTokenId,
} from "./design-system/shadows";
import { detachShadowTokenFromDocument } from "./design-system/document-shadows";
import {
  createStarterBorderTokens,
  isBorderLineStyle,
  type BorderStyle,
  type BorderToken,
  type BorderTokenId,
} from "./design-system/borders";
import { detachBorderTokenFromDocument } from "./design-system/document-borders";
import { createUniqueTokenName } from "./design-system/tokens";

export type DragPreview = {
  type: string;
  props: Record<string, unknown>;
  componentDefinitionId?: string | undefined;
  label?: string | undefined;
};

export type NewNode = NodeInsertDraft;

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
  activeModalId: ModalId | null;
  selectedNodeId: NodeId | null;
  selectedNodeIds: NodeId[];
  document: UiDocument;

  updateProjectData: (updater: (data: ProjectData) => ProjectData) => void;
  addColorToken: (draft?: { name?: string; value?: string }) => ColorTokenId;
  addStarterColorPalette: () => void;
  updateColorToken: (tokenId: ColorTokenId, patch: Partial<Pick<ColorToken, "name" | "value" | "description">>) => void;
  deleteColorToken: (tokenId: ColorTokenId) => void;
  setActiveDesignTheme: (themeId: DesignThemeId) => void;
  setSemanticColorThemeValue: (tokenId: SemanticColorTokenId, themeId: DesignThemeId, colorTokenId: ColorTokenId) => void;
  addTypographyToken: (draft?: Partial<Omit<TypographyToken, "id">>) => TypographyTokenId;
  addStarterTypographyPalette: () => void;
  updateTypographyToken: (tokenId: TypographyTokenId, patch: Partial<Omit<TypographyToken, "id">>) => void;
  deleteTypographyToken: (tokenId: TypographyTokenId) => void;
  addSpacingToken: (draft?: Partial<Omit<SpacingToken, "id">>) => SpacingTokenId;
  addStarterSpacingScale: () => void;
  updateSpacingToken: (tokenId: SpacingTokenId, patch: Partial<Omit<SpacingToken, "id">>) => void;
  deleteSpacingToken: (tokenId: SpacingTokenId) => void;
  addRadiusToken: (draft?: Partial<Omit<RadiusToken, "id">>) => RadiusTokenId;
  addStarterRadiusScale: () => void;
  updateRadiusToken: (tokenId: RadiusTokenId, patch: Partial<Omit<RadiusToken, "id">>) => void;
  deleteRadiusToken: (tokenId: RadiusTokenId) => void;
  addShadowToken: (draft?: Partial<Omit<ShadowToken, "id">>) => ShadowTokenId;
  addStarterShadowScale: () => void;
  updateShadowToken: (tokenId: ShadowTokenId, patch: Partial<Omit<ShadowToken, "id">>) => void;
  deleteShadowToken: (tokenId: ShadowTokenId) => void;
  addBorderToken: (draft?: Partial<Omit<BorderToken, "id">>) => BorderTokenId;
  addStarterBorderScale: () => void;
  updateBorderToken: (tokenId: BorderTokenId, patch: Partial<Omit<BorderToken, "id">>) => void;
  deleteBorderToken: (tokenId: BorderTokenId) => void;
  setTagValue: (path: string, value: unknown) => TagRuntimeWriteResult;

  dragPreview: DragPreview | null;
  dragX: number;
  dragY: number;
  draggedNodeId: NodeId | null;
  nodeDragCandidate: NodeDragCandidate | null;

  setActivePageId: (pageId: PageId) => void;
  setActiveModalId: (modalId: ModalId | null) => void;
  addModal: () => ModalId | null;
  deleteModal: (modalId: ModalId) => boolean;
  setStartPage: (pageId: PageId) => void;
  setPageLayout: (pageId: PageId, layoutId: PageId | null) => void;
  addPage: (parentPageId?: PageId | undefined) => PageId | null;
  addPageLayout: () => PageId | null;
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

  setReactiveEventHandler: (
    id: string,
    binding: ReactiveEventHandlerBinding | null
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
  duplicateComponentDefinitionNode: (
    componentId: string,
    nodeId: NodeId
  ) => NodeId | null;
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
  duplicateNode: (id: NodeId) => NodeId | null;
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
replaceDesignerTagData(initialEditorDocument.data);

function getActiveRootId(state: Pick<EditorState, "document" | "activePageId" | "activeModalId">) {
  if (state.activeModalId) {
    const modal = state.document.modals?.[state.activeModalId];
    if (modal) return modal.rootId;
  }
  return getPage(state.document, state.activePageId).rootId;
}

function applyActiveCommand(state: EditorState, command: DocumentCommand) {
  return applyDocumentCommand(state.document, command, getActiveRootId(state));
}

function createActiveTreeContext(state: EditorState): NodeTreeEditingContext {
  return { treeDocument: state.document, rootId: getActiveRootId(state) };
}

function createComponentTreeContext(
  state: EditorState,
  componentId: string
): NodeTreeEditingContext | null {
  const definition = state.document.components?.[componentId];
  if (!definition) return null;
  return {
    treeDocument: createComponentDefinitionDocument(state.document, definition),
    projectDocument: state.document,
    rootId: definition.rootId,
    ownerComponentId: componentId,
  };
}

function persistComponentTree(
  state: EditorState,
  componentId: string,
  treeDocument: UiDocument
): UiDocument {
  const definition = state.document.components?.[componentId];
  if (!definition) return state.document;
  return createProjectComponentRepository(state.document).upsert({
    ...definition,
    nodes: treeDocument.nodes,
  });
}

function createUniquePageName(
  document: UiDocument,
  parentPageId?: PageId,
  kind: PageKind = "page"
) {
  const siblingNames = new Set(
    Object.values(document.pages)
      .filter(
        (page) =>
          getPageKind(page) === kind &&
          page.parentPageId === parentPageId
      )
      .map((page) => page.name)
  );

  const base = kind === "layout" ? "Layout" : parentPageId ? "SubPage" : "Page";
  let index = 1;
  while (siblingNames.has(`${base}${index}`)) index += 1;
  return `${base}${index}`;
}

export const useEditorStore = create<EditorState>((set) => ({
  activePageId: initialEditorDocument.startPageId,
  activeModalId: null,
  selectedNodeId: null,
  selectedNodeIds: [],
  document: initialEditorDocument,

  updateProjectData: (updater) => {
    set((state) => {
      const current = state.document.data ?? { udts: {}, tags: {} };
      const next = updater(current);
      if (next === current) return state;
      replaceDesignerTagData(next);
      return { document: { ...state.document, data: next } };
    });
  },

  addColorToken: (draft) => {
    const tokenId = crypto.randomUUID();
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      const name = createUniqueTokenName(
        designSystem.colors,
        draft?.name?.trim() || "Color"
      );
      const token: ColorToken = {
        id: tokenId,
        name,
        value: draft?.value?.trim() || "#7c3aed",
      };
      return {
        document: {
          ...state.document,
          designSystem: {
            ...designSystem,
            colors: { ...designSystem.colors, [tokenId]: token },
          },
        },
      };
    });
    return tokenId;
  },

  addStarterColorPalette: () => {
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      const nextColors = { ...designSystem.colors };
      for (const token of createStarterColorTokens()) {
        const name = createUniqueTokenName(nextColors, token.name);
        nextColors[token.id] = { ...token, name };
      }
      return {
        document: {
          ...state.document,
          designSystem: { ...designSystem, colors: nextColors },
        },
      };
    });
  },

  updateColorToken: (tokenId, patch) => {
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      const current = designSystem.colors[tokenId];
      if (!current) return state;
      const nextName = patch.name === undefined
        ? current.name
        : createUniqueTokenName(
            designSystem.colors,
            patch.name.trim() || current.name,
            tokenId
          );
      return {
        document: {
          ...state.document,
          designSystem: {
            ...designSystem,
            colors: {
              ...designSystem.colors,
              [tokenId]: {
                ...current,
                ...patch,
                name: nextName,
                value: patch.value?.trim() || current.value,
              },
            },
          },
        },
      };
    });
  },

  deleteColorToken: (tokenId) => {
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      const token = designSystem.colors[tokenId];
      if (!token) return state;

      const detached = detachColorTokenFromDocument(state.document, tokenId, token.value);
      const nextColors = { ...designSystem.colors };
      delete nextColors[tokenId];
      return {
        document: {
          ...detached,
          designSystem: {
            ...(detached.designSystem ?? designSystem),
            colors: nextColors,
          },
        },
      };
    });
  },

  setActiveDesignTheme: (themeId) => {
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      if (!designSystem.themes?.[themeId] || designSystem.activeThemeId === themeId) return state;
      return {
        document: {
          ...state.document,
          designSystem: { ...designSystem, activeThemeId: themeId },
        },
      };
    });
  },

  setSemanticColorThemeValue: (tokenId, themeId, colorTokenId) => {
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      const token = designSystem.semanticColors?.[tokenId];
      if (!token || !designSystem.themes?.[themeId] || !designSystem.colors[colorTokenId]) return state;
      return {
        document: {
          ...state.document,
          designSystem: {
            ...designSystem,
            semanticColors: {
              ...(designSystem.semanticColors ?? {}),
              [tokenId]: {
                ...token,
                values: {
                  ...token.values,
                  [themeId]: createColorTokenRef(colorTokenId),
                },
              },
            },
          },
        },
      };
    });
  },

  addTypographyToken: (draft) => {
    const tokenId = crypto.randomUUID();
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      const typography = designSystem.typography ?? {};
      const fallback = createStarterTypographyTokens()[4]!;
      const name = createUniqueTokenName(typography, draft?.name?.trim() || "Text style");
      const token: TypographyToken = {
        ...fallback,
        ...draft,
        id: tokenId,
        name,
        fontFamily: draft?.fontFamily?.trim() || fallback.fontFamily,
        lineHeight: draft?.lineHeight?.trim() || fallback.lineHeight,
      };
      return {
        document: {
          ...state.document,
          designSystem: {
            ...designSystem,
            typography: { ...typography, [tokenId]: token },
          },
        },
      };
    });
    return tokenId;
  },

  addStarterTypographyPalette: () => {
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      const nextTypography = { ...(designSystem.typography ?? {}) };
      for (const token of createStarterTypographyTokens()) {
        const name = createUniqueTokenName(nextTypography, token.name);
        nextTypography[token.id] = { ...token, name };
      }
      return {
        document: {
          ...state.document,
          designSystem: { ...designSystem, typography: nextTypography },
        },
      };
    });
  },

  updateTypographyToken: (tokenId, patch) => {
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      const typography = designSystem.typography ?? {};
      const current = typography[tokenId];
      if (!current) return state;
      const nextName = patch.name === undefined
        ? current.name
        : createUniqueTokenName(typography, patch.name.trim() || current.name, tokenId);
      return {
        document: {
          ...state.document,
          designSystem: {
            ...designSystem,
            typography: {
              ...typography,
              [tokenId]: {
                ...current,
                ...patch,
                name: nextName,
                fontFamily: patch.fontFamily?.trim() || current.fontFamily,
                lineHeight: patch.lineHeight?.trim() || current.lineHeight,
              },
            },
          },
        },
      };
    });
  },

  deleteTypographyToken: (tokenId) => {
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      const typography = designSystem.typography ?? {};
      const token = typography[tokenId];
      if (!token) return state;
      const detached = detachTypographyTokenFromDocument(
        state.document,
        tokenId,
        typographyTokenToStyle(token)
      );
      const nextTypography = { ...typography };
      delete nextTypography[tokenId];
      return {
        document: {
          ...detached,
          designSystem: { ...designSystem, typography: nextTypography },
        },
      };
    });
  },

  addSpacingToken: (draft) => {
    const tokenId = crypto.randomUUID();
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      const spacing = designSystem.spacing ?? {};
      const name = createUniqueTokenName(spacing, draft?.name?.trim() || "Spacing");
      const token: SpacingToken = {
        id: tokenId,
        name,
        value:
          typeof draft?.value === "number" && Number.isFinite(draft.value)
            ? Math.max(0, draft.value)
            : 16,
        ...(draft?.description !== undefined ? { description: draft.description } : {}),
      };
      return {
        document: {
          ...state.document,
          designSystem: {
            ...designSystem,
            spacing: { ...spacing, [tokenId]: token },
          },
        },
      };
    });
    return tokenId;
  },

  addStarterSpacingScale: () => {
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      const nextSpacing = { ...(designSystem.spacing ?? {}) };
      for (const token of createStarterSpacingTokens()) {
        const name = createUniqueTokenName(nextSpacing, token.name);
        nextSpacing[token.id] = { ...token, name };
      }
      return {
        document: {
          ...state.document,
          designSystem: { ...designSystem, spacing: nextSpacing },
        },
      };
    });
  },

  updateSpacingToken: (tokenId, patch) => {
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      const spacing = designSystem.spacing ?? {};
      const current = spacing[tokenId];
      if (!current) return state;
      const nextName = patch.name === undefined
        ? current.name
        : createUniqueTokenName(spacing, patch.name.trim() || current.name, tokenId);
      const nextValue = patch.value === undefined
        ? current.value
        : Number.isFinite(patch.value)
          ? Math.max(0, patch.value)
          : current.value;
      return {
        document: {
          ...state.document,
          designSystem: {
            ...designSystem,
            spacing: {
              ...spacing,
              [tokenId]: {
                ...current,
                ...patch,
                name: nextName,
                value: nextValue,
              },
            },
          },
        },
      };
    });
  },

  deleteSpacingToken: (tokenId) => {
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      const spacing = designSystem.spacing ?? {};
      const token = spacing[tokenId];
      if (!token) return state;
      const detached = detachSpacingTokenFromDocument(state.document, tokenId, token.value);
      const nextSpacing = { ...spacing };
      delete nextSpacing[tokenId];
      return {
        document: {
          ...detached,
          designSystem: { ...designSystem, spacing: nextSpacing },
        },
      };
    });
  },

  addRadiusToken: (draft) => {
    const tokenId = crypto.randomUUID();
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      const radius = designSystem.radius ?? {};
      const name = createUniqueTokenName(radius, draft?.name?.trim() || "Radius");
      const token: RadiusToken = {
        id: tokenId,
        name,
        value:
          typeof draft?.value === "number" && Number.isFinite(draft.value)
            ? Math.max(0, draft.value)
            : 8,
        ...(draft?.description !== undefined ? { description: draft.description } : {}),
      };
      return {
        document: {
          ...state.document,
          designSystem: {
            ...designSystem,
            radius: { ...radius, [tokenId]: token },
          },
        },
      };
    });
    return tokenId;
  },

  addStarterRadiusScale: () => {
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      const nextRadius = { ...(designSystem.radius ?? {}) };
      for (const token of createStarterRadiusTokens()) {
        const name = createUniqueTokenName(nextRadius, token.name);
        nextRadius[token.id] = { ...token, name };
      }
      return {
        document: {
          ...state.document,
          designSystem: { ...designSystem, radius: nextRadius },
        },
      };
    });
  },

  updateRadiusToken: (tokenId, patch) => {
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      const radius = designSystem.radius ?? {};
      const current = radius[tokenId];
      if (!current) return state;
      const nextName = patch.name === undefined
        ? current.name
        : createUniqueTokenName(radius, patch.name.trim() || current.name, tokenId);
      const nextValue = patch.value === undefined
        ? current.value
        : Number.isFinite(patch.value)
          ? Math.max(0, patch.value)
          : current.value;
      return {
        document: {
          ...state.document,
          designSystem: {
            ...designSystem,
            radius: {
              ...radius,
              [tokenId]: {
                ...current,
                ...patch,
                name: nextName,
                value: nextValue,
              },
            },
          },
        },
      };
    });
  },

  deleteRadiusToken: (tokenId) => {
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      const radius = designSystem.radius ?? {};
      const token = radius[tokenId];
      if (!token) return state;
      const detached = detachRadiusTokenFromDocument(state.document, tokenId, token.value);
      const nextRadius = { ...radius };
      delete nextRadius[tokenId];
      return {
        document: {
          ...detached,
          designSystem: { ...designSystem, radius: nextRadius },
        },
      };
    });
  },

  addShadowToken: (draft) => {
    const tokenId = crypto.randomUUID();
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      const shadows = designSystem.shadows ?? {};
      const name = createUniqueTokenName(shadows, draft?.name?.trim() || "Elevation");
      const token: ShadowToken = {
        id: tokenId,
        name,
        x: finiteOr(draft?.x, 0),
        y: finiteOr(draft?.y, 4),
        blur: Math.max(0, finiteOr(draft?.blur, 12)),
        spread: finiteOr(draft?.spread, -2),
        color: draft?.color?.trim() || "rgba(15, 23, 42, 0.12)",
        ...(draft?.description !== undefined ? { description: draft.description } : {}),
      };
      return {
        document: {
          ...state.document,
          designSystem: { ...designSystem, shadows: { ...shadows, [tokenId]: token } },
        },
      };
    });
    return tokenId;
  },

  addStarterShadowScale: () => {
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      const nextShadows = { ...(designSystem.shadows ?? {}) };
      for (const token of createStarterShadowTokens()) {
        const name = createUniqueTokenName(nextShadows, token.name);
        nextShadows[token.id] = { ...token, name };
      }
      return {
        document: {
          ...state.document,
          designSystem: { ...designSystem, shadows: nextShadows },
        },
      };
    });
  },

  updateShadowToken: (tokenId, patch) => {
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      const shadows = designSystem.shadows ?? {};
      const current = shadows[tokenId];
      if (!current) return state;
      const nextName = patch.name === undefined
        ? current.name
        : createUniqueTokenName(shadows, patch.name.trim() || current.name, tokenId);
      const nextToken: ShadowToken = {
        ...current,
        ...patch,
        name: nextName,
        x: patch.x === undefined ? current.x : finiteOr(patch.x, current.x),
        y: patch.y === undefined ? current.y : finiteOr(patch.y, current.y),
        blur: patch.blur === undefined ? current.blur : Math.max(0, finiteOr(patch.blur, current.blur)),
        spread: patch.spread === undefined ? current.spread : finiteOr(patch.spread, current.spread),
        color: patch.color === undefined ? current.color : patch.color.trim() || current.color,
      };
      return {
        document: {
          ...state.document,
          designSystem: { ...designSystem, shadows: { ...shadows, [tokenId]: nextToken } },
        },
      };
    });
  },

  deleteShadowToken: (tokenId) => {
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      const shadows = designSystem.shadows ?? {};
      const token = shadows[tokenId];
      if (!token) return state;
      const replacement: ShadowStyle = {
        x: token.x,
        y: token.y,
        blur: token.blur,
        spread: token.spread,
        color: token.color,
      };
      const detached = detachShadowTokenFromDocument(state.document, tokenId, replacement);
      const nextShadows = { ...shadows };
      delete nextShadows[tokenId];
      return {
        document: {
          ...detached,
          designSystem: { ...designSystem, shadows: nextShadows },
        },
      };
    });
  },

  addBorderToken: (draft) => {
    const tokenId = crypto.randomUUID();
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      const borders = designSystem.borders ?? {};
      const name = createUniqueTokenName(borders, draft?.name?.trim() || "Stroke");
      const token: BorderToken = {
        id: tokenId,
        name,
        width: Math.max(0, finiteOr(draft?.width, 1)),
        style: isBorderLineStyle(draft?.style) ? draft.style : "solid",
        color: draft?.color?.trim() || "#d4d4d8",
        ...(draft?.description !== undefined ? { description: draft.description } : {}),
      };
      return {
        document: {
          ...state.document,
          designSystem: { ...designSystem, borders: { ...borders, [tokenId]: token } },
        },
      };
    });
    return tokenId;
  },

  addStarterBorderScale: () => {
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      const nextBorders = { ...(designSystem.borders ?? {}) };
      for (const token of createStarterBorderTokens()) {
        const name = createUniqueTokenName(nextBorders, token.name);
        nextBorders[token.id] = { ...token, name };
      }
      return {
        document: {
          ...state.document,
          designSystem: { ...designSystem, borders: nextBorders },
        },
      };
    });
  },

  updateBorderToken: (tokenId, patch) => {
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      const borders = designSystem.borders ?? {};
      const current = borders[tokenId];
      if (!current) return state;
      const nextName = patch.name === undefined
        ? current.name
        : createUniqueTokenName(borders, patch.name.trim() || current.name, tokenId);
      const nextToken: BorderToken = {
        ...current,
        ...patch,
        name: nextName,
        width: patch.width === undefined ? current.width : Math.max(0, finiteOr(patch.width, current.width)),
        style: patch.style === undefined
          ? current.style
          : isBorderLineStyle(patch.style)
            ? patch.style
            : current.style,
        color: patch.color === undefined ? current.color : patch.color.trim() || current.color,
      };
      return {
        document: {
          ...state.document,
          designSystem: { ...designSystem, borders: { ...borders, [tokenId]: nextToken } },
        },
      };
    });
  },

  deleteBorderToken: (tokenId) => {
    set((state) => {
      const designSystem = state.document.designSystem ?? createEmptyDesignSystem();
      const borders = designSystem.borders ?? {};
      const token = borders[tokenId];
      if (!token) return state;
      const replacement: BorderStyle = {
        width: token.width,
        style: token.style,
        color: token.color,
      };
      const detached = detachBorderTokenFromDocument(state.document, tokenId, replacement);
      const nextBorders = { ...borders };
      delete nextBorders[tokenId];
      return {
        document: {
          ...detached,
          designSystem: { ...designSystem, borders: nextBorders },
        },
      };
    });
  },

  setTagValue: (path, value) => {
    return writeDesignerTagValue(path, value);
  },

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
        activeModalId: null,
        selectedNodeId: page.rootId,
        selectedNodeIds: [page.rootId],
        draggedNodeId: null,
        nodeDragCandidate: null,
        dragPreview: null,
      };
    });
  },

  setActiveModalId: (modalId) => {
    set((state) => {
      if (!modalId) {
        const page = getPage(state.document, state.activePageId);
        return {
          activeModalId: null,
          selectedNodeId: page.rootId,
          selectedNodeIds: [page.rootId],
          draggedNodeId: null,
          nodeDragCandidate: null,
          dragPreview: null,
        };
      }
      const modal = state.document.modals?.[modalId];
      if (!modal) return state;
      return {
        activeModalId: modalId,
        selectedNodeId: modal.rootId,
        selectedNodeIds: [modal.rootId],
        draggedNodeId: null,
        nodeDragCandidate: null,
        dragPreview: null,
      };
    });
  },

  addModal: () => {
    let createdId: ModalId | null = null;
    set((state) => {
      const existingNames = new Set(Object.values(state.document.modals ?? {}).map((modal) => modal.name));
      let index = 1;
      while (existingNames.has(`Modal${index}`)) index += 1;
      const name = `Modal${index}`;
      const root = createModalRootNode(name);
      const modalId = crypto.randomUUID();
      createdId = modalId;
      return {
        document: {
          ...state.document,
          modals: {
            ...(state.document.modals ?? {}),
            [modalId]: {
              id: modalId,
              name,
              rootId: root.id,
              closeOnBackdrop: true,
              closeOnEscape: true,
            },
          },
          nodes: { ...state.document.nodes, [root.id]: root },
        },
        activeModalId: modalId,
        selectedNodeId: root.id,
        selectedNodeIds: [root.id],
      };
    });
    return createdId;
  },

  deleteModal: (modalId) => {
    let deleted = false;
    set((state) => {
      const modal = state.document.modals?.[modalId];
      if (!modal) return state;
      const ids: string[] = [];
      const stack = [modal.rootId];
      const visited = new Set<string>();
      while (stack.length > 0) {
        const id = stack.pop();
        if (!id || visited.has(id)) continue;
        visited.add(id);
        const node = state.document.nodes[id];
        if (!node) continue;
        ids.push(id);
        for (const child of node.children ?? []) stack.push(child);
      }
      const modals = { ...(state.document.modals ?? {}) };
      delete modals[modalId];
      const nodes = { ...state.document.nodes };
      for (const id of ids) delete nodes[id];
      const page = getPage(state.document, state.activePageId);
      deleted = true;
      return {
        document: {
          ...state.document,
          modals: Object.keys(modals).length > 0 ? modals : undefined,
          nodes,
        },
        activeModalId: state.activeModalId === modalId ? null : state.activeModalId,
        selectedNodeId: state.activeModalId === modalId ? page.rootId : state.selectedNodeId,
        selectedNodeIds: state.activeModalId === modalId ? [page.rootId] : state.selectedNodeIds.filter((id) => !!nodes[id]),
      };
    });
    return deleted;
  },

  setStartPage: (pageId) => {
    set((state) => {
      const page = state.document.pages[pageId];
      if (!page || getPageKind(page) !== "page") return state;
      return { document: withStartPage(state.document, pageId) };
    });
  },

  setPageLayout: (pageId, layoutId) => {
    set((state) => {
      const page = state.document.pages[pageId];
      if (!page || getPageKind(page) !== "page") return state;
      if (layoutId) {
        const layout = state.document.pages[layoutId];
        if (!layout || getPageKind(layout) !== "layout") return state;
      }

      const nextPage = { ...page };
      if (layoutId) nextPage.layoutId = layoutId;
      else delete nextPage.layoutId;

      return {
        document: {
          ...state.document,
          pages: { ...state.document.pages, [pageId]: nextPage },
        },
      };
    });
  },

  addPage: (parentPageId) => {
    let createdPageId: PageId | null = null;

    set((state) => {
      if (parentPageId) {
        const parent = state.document.pages[parentPageId];
        if (!parent || getPageKind(parent) !== "page") return state;
      }

      const name = createUniquePageName(state.document, parentPageId, "page");
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
              kind: "page",
              ...(parentPageId ? { parentPageId } : {}),
            },
          },
          nodes: {
            ...state.document.nodes,
            [root.id]: root,
          },
        },
        activePageId: pageId,
        activeModalId: null,
        selectedNodeId: root.id,
        selectedNodeIds: [root.id],
      };
    });

    return createdPageId;
  },

  addPageLayout: () => {
    let createdPageId: PageId | null = null;

    set((state) => {
      const name = createUniquePageName(state.document, undefined, "layout");
      const { root, slot } = createPageLayoutNodes(name);
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
              kind: "layout",
            },
          },
          nodes: {
            ...state.document.nodes,
            [root.id]: root,
            [slot.id]: slot,
          },
        },
        activePageId: pageId,
        activeModalId: null,
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

      for (const [remainingPageId, remainingPage] of Object.entries(pages)) {
        if (remainingPage.layoutId && deletedPageIds.has(remainingPage.layoutId)) {
          const detached = { ...remainingPage };
          delete detached.layoutId;
          pages[remainingPageId] = detached;
        }
      }

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
      activeModalId: null,
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
      const modalEntry = Object.values(state.document.modals ?? {}).find(
        (modal) => modal.rootId === nodeId
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
            getPageKind(page) === getPageKind(pageEntry) &&
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

      if (
        modalEntry &&
        Object.values(state.document.modals ?? {}).some(
          (modal) => modal.id !== modalEntry.id && modal.name === validation.name
        )
      ) {
        result = {
          ok: false,
          error: `“${validation.name}” is already used by another modal.`,
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
      if (modalEntry) {
        return {
          document: {
            ...renamedDocument,
            modals: {
              ...(renamedDocument.modals ?? {}),
              [modalEntry.id]: { ...modalEntry, name: validation.name },
            },
          },
        };
      }
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
    set((state) => ({
      document: updateNodeInTree(createActiveTreeContext(state), id, updater),
    }));
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

  setReactiveEventHandler: (id, binding) => {
    set((state) => {
      const reactiveEvents = { ...(state.document.reactiveEvents ?? {}) };
      if (binding) reactiveEvents[id] = binding;
      else delete reactiveEvents[id];
      return {
        document: {
          ...state.document,
          reactiveEvents: Object.keys(reactiveEvents).length > 0
            ? reactiveEvents
            : undefined,
        },
      };
    });
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
      const context = createComponentTreeContext(state, componentId);
      if (!context) return state;
      const treeDocument = updateNodeInTree(context, nodeId, updater);
      return {
        document: persistComponentTree(state, componentId, treeDocument),
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
      const context = createComponentTreeContext(state, componentId);
      if (!context) return state;
      const result = insertNodeIntoTree(context, parentId, insertIndex, node);
      if (!result.insertedNodeId) return state;
      insertedId = result.insertedNodeId;
      return {
        document: persistComponentTree(state, componentId, result.document),
        dragPreview: null,
        draggedNodeId: null,
        nodeDragCandidate: null,
      };
    });
    return insertedId;
  },

  deleteComponentDefinitionNode: (componentId, nodeId) => {
    set((state) => {
      const context = createComponentTreeContext(state, componentId);
      if (!context) return state;
      const treeDocument = deleteNodeFromTree(context, nodeId);
      if (treeDocument === context.treeDocument) return state;
      return { document: persistComponentTree(state, componentId, treeDocument) };
    });
  },

  duplicateComponentDefinitionNode: (componentId, nodeId) => {
    let duplicatedNodeId: NodeId | null = null;
    set((state) => {
      const context = createComponentTreeContext(state, componentId);
      if (!context) return state;
      const result = duplicateNodeInTree(context, nodeId);
      if (!result.duplicatedNodeId) return state;
      duplicatedNodeId = result.duplicatedNodeId;
      return {
        document: persistComponentTree(state, componentId, result.document),
      };
    });
    return duplicatedNodeId;
  },

  moveComponentDefinitionNode: (
    componentId,
    nodeId,
    targetParentId,
    targetIndex
  ) => {
    set((state) => {
      const context = createComponentTreeContext(state, componentId);
      if (!context) return state;
      const treeDocument = moveNodeInTree(
        context,
        nodeId,
        targetParentId,
        targetIndex
      );
      return {
        document: persistComponentTree(state, componentId, treeDocument),
        draggedNodeId: null,
        nodeDragCandidate: null,
      };
    });
  },

  insertNode: (parentId, insertIndex, node) => {
    set((state) => {
      const result = insertNodeIntoTree(
        createActiveTreeContext(state),
        parentId,
        insertIndex,
        node
      );
      const insertedId = result.insertedNodeId;
      return {
        document: result.document,
        selectedNodeId: insertedId ?? state.selectedNodeId,
        selectedNodeIds: insertedId ? [insertedId] : state.selectedNodeIds,
        dragPreview: null,
        draggedNodeId: null,
        nodeDragCandidate: null,
      };
    });
  },

  deleteNode: (id) => {
    set((state) => {
      const context = createActiveTreeContext(state);
      const parentId = buildDocumentIndex(state.document, context.rootId).parentById.get(id);
      const document = deleteNodeFromTree(context, id);
      const selectedNodeIds = state.selectedNodeIds.filter(
        (nodeId) => !!document.nodes[nodeId]
      );
      const fallbackSelection =
        selectedNodeIds[0] ??
        (parentId && document.nodes[parentId] ? parentId : null);
      return {
        document,
        selectedNodeIds: fallbackSelection ? [fallbackSelection] : [],
        selectedNodeId:
          state.selectedNodeId && document.nodes[state.selectedNodeId]
            ? state.selectedNodeId
            : fallbackSelection,
      };
    });
  },

  duplicateNode: (id) => {
    let duplicatedNodeId: NodeId | null = null;
    set((state) => {
      const result = duplicateNodeInTree(createActiveTreeContext(state), id);
      if (!result.duplicatedNodeId) return state;
      duplicatedNodeId = result.duplicatedNodeId;
      return {
        document: result.document,
        selectedNodeId: result.duplicatedNodeId,
        selectedNodeIds: [result.duplicatedNodeId],
        draggedNodeId: null,
        nodeDragCandidate: null,
      };
    });
    return duplicatedNodeId;
  },

  moveNodeUp: (nodeId) => {
    set((state) => ({
      document: moveNodeByInTree(createActiveTreeContext(state), nodeId, -1),
    }));
  },

  moveNodeDown: (nodeId) => {
    set((state) => ({
      document: moveNodeByInTree(createActiveTreeContext(state), nodeId, 1),
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
      document: moveNodeInTree(
        createActiveTreeContext(state),
        nodeId,
        targetParentId,
        targetIndex
      ),
      draggedNodeId: null,
      nodeDragCandidate: null,
      selectedNodeId: nodeId,
      selectedNodeIds: [nodeId],
    }));
  },
}));

function finiteOr(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
