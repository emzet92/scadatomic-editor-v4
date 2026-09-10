import { buildDocumentIndex } from "../core/document-index";
import type { PageId, UiDocument } from "../core/document";

export type ComponentEditorMode = {
  nodeId: string;
  variantName: string;
};

export type ComponentDefinitionEditorMode = {
  componentId: string;
  selectedInternalNodeId: string;
  variantName?: string | undefined;
};

export type PageScopedMode<T> = {
  pageId: PageId;
  mode: T;
};

export function scopeMode<T>(pageId: PageId, mode: T): PageScopedMode<T> {
  return { pageId, mode };
}

/**
 * Component-focused editor state is page-local. Deriving its validity avoids
 * synchronization effects that only exist to repair stale React state.
 */
export function resolveComponentEditorMode(
  document: UiDocument,
  activePageId: PageId,
  scoped: PageScopedMode<ComponentEditorMode> | null
): ComponentEditorMode | null {
  if (!scoped || scoped.pageId !== activePageId) return null;

  const page = document.pages[activePageId];
  const node = document.nodes[scoped.mode.nodeId];
  if (!page || !node?.variants?.[scoped.mode.variantName]) return null;

  const pageIndex = buildDocumentIndex(document, page.rootId);
  return pageIndex.depthById.has(node.id) ? scoped.mode : null;
}

export function resolveComponentDefinitionEditorMode(
  document: UiDocument,
  activePageId: PageId,
  scoped: PageScopedMode<ComponentDefinitionEditorMode> | null
): ComponentDefinitionEditorMode | null {
  if (!scoped || scoped.pageId !== activePageId) return null;

  const definition = document.components?.[scoped.mode.componentId];
  if (!definition) return null;

  const selectedNode =
    definition.nodes[scoped.mode.selectedInternalNodeId] ??
    definition.nodes[definition.rootId];
  if (!selectedNode) return null;

  const variantName = scoped.mode.variantName;
  return {
    componentId: definition.id,
    selectedInternalNodeId: selectedNode.id,
    ...(variantName && selectedNode.variants?.[variantName]
      ? { variantName }
      : {}),
  };
}
