import {
  getPage,
  getPageKind,
  type NodeId,
  type PageId,
  type UiDocument,
  type UiNode,
  type UiPage,
} from "./document";

export const PAGE_CONTENT_SLOT_NAME = "content";

export function getPageLayout(
  document: UiDocument,
  page: UiPage
): UiPage | undefined {
  if (getPageKind(page) !== "page" || !page.layoutId) return undefined;
  const layout = document.pages[page.layoutId];
  return layout && getPageKind(layout) === "layout" ? layout : undefined;
}

export function getPageLayouts(document: UiDocument): UiPage[] {
  return Object.values(document.pages).filter(
    (page) => getPageKind(page) === "layout"
  );
}

export function hasPageContentSlot(document: UiDocument, layout: UiPage) {
  if (getPageKind(layout) !== "layout") return false;
  return collectSubtreeNodeIds(document, layout.rootId).some((nodeId) => {
    const node = document.nodes[nodeId];
    return (
      node?.type === "PageSlot" &&
      String(node.props?.slotName ?? PAGE_CONTENT_SLOT_NAME) ===
        PAGE_CONTENT_SLOT_NAME
    );
  });
}

/**
 * Builds an ephemeral render view for a page using a PageLayout.
 * Persisted project nodes are never mutated or copied back into the document.
 */
export function createPageRenderDocument(
  document: UiDocument,
  pageId: PageId | undefined
): UiDocument {
  const page = getPage(document, pageId);
  const layout = getPageLayout(document, page);
  if (!layout) {
    return document.rootId === page.rootId
      ? document
      : { ...document, rootId: page.rootId };
  }

  const pageRoot = document.nodes[page.rootId];
  if (!pageRoot) return { ...document, rootId: layout.rootId };

  const nodes: Record<NodeId, UiNode> = {
    ...document.nodes,
    [pageRoot.id]: {
      ...pageRoot,
      props: {
        ...(pageRoot.props ?? {}),
        embeddedInLayout: true,
      },
    },
  };

  for (const nodeId of collectSubtreeNodeIds(document, layout.rootId)) {
    const node = document.nodes[nodeId];
    if (
      node?.type !== "PageSlot" ||
      String(node.props?.slotName ?? PAGE_CONTENT_SLOT_NAME) !==
        PAGE_CONTENT_SLOT_NAME
    ) {
      continue;
    }

    nodes[nodeId] = {
      ...node,
      children: [page.rootId],
    };
  }

  return {
    ...document,
    rootId: layout.rootId,
    nodes,
  };
}

export function collectSubtreeNodeIds(
  document: UiDocument,
  rootId: NodeId
): NodeId[] {
  const result: NodeId[] = [];
  const visited = new Set<NodeId>();
  const stack = [rootId];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    const node = document.nodes[current];
    if (!node) continue;
    result.push(current);
    for (const childId of node.children ?? []) stack.push(childId);
  }

  return result;
}
