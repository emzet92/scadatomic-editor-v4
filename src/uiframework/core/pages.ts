import type { NodeId, PageId, UiDocument } from "./document";

export type PageDeletionPlan = {
  pageIds: PageId[];
  nodeIds: NodeId[];
  fallbackPageId: PageId | null;
};

/**
 * Returns the page and all nested subpages in depth-first order.
 */
export function collectPageSubtreeIds(
  document: UiDocument,
  pageId: PageId
): PageId[] {
  if (!document.pages[pageId]) return [];

  const childrenByParent = new Map<PageId, PageId[]>();
  for (const page of Object.values(document.pages)) {
    if (!page.parentPageId) continue;
    const children = childrenByParent.get(page.parentPageId) ?? [];
    children.push(page.id);
    childrenByParent.set(page.parentPageId, children);
  }

  const result: PageId[] = [];
  const stack: PageId[] = [pageId];
  const visited = new Set<PageId>();

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId || visited.has(currentId)) continue;
    visited.add(currentId);
    result.push(currentId);

    const children = childrenByParent.get(currentId) ?? [];
    for (let index = children.length - 1; index >= 0; index -= 1) {
      const childId = children[index];
      if (childId) stack.push(childId);
    }
  }

  return result;
}

/**
 * Collects nodes owned by the supplied pages. Component definitions are not
 * touched because they live in their own node tables.
 */
export function collectPageNodeIds(
  document: UiDocument,
  pageIds: Iterable<PageId>
): NodeId[] {
  const result: NodeId[] = [];
  const visited = new Set<NodeId>();

  for (const pageId of pageIds) {
    const page = document.pages[pageId];
    if (!page) continue;

    const stack: NodeId[] = [page.rootId];
    while (stack.length > 0) {
      const nodeId = stack.pop();
      if (!nodeId || visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = document.nodes[nodeId];
      if (!node) continue;
      result.push(nodeId);

      for (const childId of node.children ?? []) {
        stack.push(childId);
      }
    }
  }

  return result;
}

/**
 * Builds all information required for an atomic page deletion. The preferred
 * fallback is the deleted page's parent, then the first remaining top-level
 * page, then any remaining page.
 */
export function createPageDeletionPlan(
  document: UiDocument,
  pageId: PageId
): PageDeletionPlan | null {
  const page = document.pages[pageId];
  if (!page) return null;

  const pageIds = collectPageSubtreeIds(document, pageId);
  if (pageIds.length === 0) return null;

  const deletedIds = new Set(pageIds);
  const remainingPages = Object.values(document.pages).filter(
    (candidate) => !deletedIds.has(candidate.id)
  );

  // A project must always have at least one renderable page.
  if (remainingPages.length === 0) return null;

  const parentFallback = page.parentPageId
    ? remainingPages.find((candidate) => candidate.id === page.parentPageId)
    : undefined;
  const topLevelFallback = remainingPages.find(
    (candidate) => !candidate.parentPageId
  );
  const fallback = parentFallback ?? topLevelFallback ?? remainingPages[0] ?? null;

  return {
    pageIds,
    nodeIds: collectPageNodeIds(document, pageIds),
    fallbackPageId: fallback?.id ?? null,
  };
}

export function withStartPage(
  document: UiDocument,
  pageId: PageId
): UiDocument {
  const page = document.pages[pageId];
  if (!page) return document;

  return {
    ...document,
    startPageId: page.id,
    rootId: page.rootId,
  };
}
