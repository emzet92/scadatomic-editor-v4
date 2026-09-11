import { getPageKind, type PageId, type UiDocument, type UiPage } from "../core/document";

export type NavigationTreeNode = {
  pageId: PageId;
  name: string;
  path: string;
  children: NavigationTreeNode[];
};

export function buildNavigationTree(document: UiDocument): NavigationTreeNode[] {
  const childrenByParent = new Map<string | null, UiPage[]>();

  for (const page of Object.values(document.pages)) {
    if (getPageKind(page) !== "page") continue;
    const parentKey = page.parentPageId ?? null;
    const children = childrenByParent.get(parentKey) ?? [];
    children.push(page);
    childrenByParent.set(parentKey, children);
  }

  function materialize(page: UiPage, parentPath: string): NavigationTreeNode {
    const path = parentPath ? `${parentPath}/${page.name}` : page.name;
    return {
      pageId: page.id,
      name: page.name,
      path,
      children: (childrenByParent.get(page.id) ?? []).map((child) =>
        materialize(child, path)
      ),
    };
  }

  return (childrenByParent.get(null) ?? []).map((page) => materialize(page, ""));
}

export function flattenNavigationTree(
  tree: NavigationTreeNode[]
): NavigationTreeNode[] {
  const result: NavigationTreeNode[] = [];

  function visit(node: NavigationTreeNode) {
    result.push(node);
    for (const child of node.children) visit(child);
  }

  for (const node of tree) visit(node);
  return result;
}

export function resolveNavigationPath(
  document: UiDocument,
  inputPath: string
): NavigationTreeNode | undefined {
  const normalized = normalizeNavigationPath(inputPath);
  if (!normalized) return undefined;

  return flattenNavigationTree(buildNavigationTree(document)).find(
    (entry) => entry.path === normalized
  );
}

export function getNavigationPathForPage(
  document: UiDocument,
  pageId: PageId
): string | undefined {
  return flattenNavigationTree(buildNavigationTree(document)).find(
    (entry) => entry.pageId === pageId
  )?.path;
}

export function normalizeNavigationPath(path: string) {
  return path
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join("/");
}

export function getTopLevelNavigation(document: UiDocument) {
  return buildNavigationTree(document);
}
