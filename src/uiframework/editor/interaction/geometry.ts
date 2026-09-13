import { buildDocumentIndex } from "../../core/document-index";
import type { NodeId, UiDocument } from "../../core/document";

export type RectInfo = {
  id: NodeId;
  parentId?: NodeId | undefined;
  childIndex?: number | undefined;
  depth: number;
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
};

export type DropTarget = {
  parentId: NodeId;
  insertIndex: number;
};

export type DropIndicatorRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function collectNodeRects(
  document: UiDocument,
  root: ParentNode,
  nodeAttribute = "data-node-id"
): RectInfo[] {
  const index = buildDocumentIndex(document);
  const result: RectInfo[] = [];

  root.querySelectorAll<HTMLElement>(`[${nodeAttribute}]`).forEach((element) => {
    const id = element.getAttribute(nodeAttribute) ?? undefined;
    if (!id) {
      return;
    }

    const rect = element.getBoundingClientRect();

    result.push({
      id,
      parentId: index.parentById.get(id),
      childIndex: index.childIndexById.get(id),
      depth: index.depthById.get(id) ?? 0,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      right: rect.right,
      bottom: rect.bottom,
    });
  });

  return result;
}

export function findDeepestRect(
  rects: readonly RectInfo[],
  x: number,
  y: number
): RectInfo | null {
  let best: RectInfo | null = null;

  for (const rect of rects) {
    if (
      x < rect.left ||
      x > rect.right ||
      y < rect.top ||
      y > rect.bottom
    ) {
      continue;
    }

    if (!best || rect.depth > best.depth) {
      best = rect;
    }
  }

  return best;
}

export function findContainerInsertIndex(
  document: UiDocument,
  rects: readonly RectInfo[],
  containerId: NodeId,
  pointerX: number,
  pointerY: number
): number {
  const container = document.nodes[containerId];
  const children = container?.children ?? [];
  const display = container?.props?.display === "flex" ? "flex" : "grid";
  const positioned = children.flatMap((childId, index) => {
    const rect = rects.find((candidate) => candidate.id === childId);
    return rect ? [{ index, rect }] : [];
  });

  if (positioned.length === 0) return 0;

  if (display === "flex") {
    for (const item of positioned) {
      if (pointerX < item.rect.left + item.rect.width / 2) {
        return item.index;
      }
    }
    return children.length;
  }

  const rows = groupGridRows(positioned);
  for (const row of rows) {
    const rowTop = Math.min(...row.map((item) => item.rect.top));
    const rowBottom = Math.max(...row.map((item) => item.rect.bottom));
    const rowMiddle = rowTop + (rowBottom - rowTop) / 2;

    if (pointerY < rowTop) {
      return row[0]?.index ?? 0;
    }

    if (pointerY <= rowBottom || pointerY < rowMiddle) {
      for (const item of row) {
        if (pointerX < item.rect.left + item.rect.width / 2) {
          return item.index;
        }
      }
      const last = row[row.length - 1];
      return last ? last.index + 1 : children.length;
    }
  }

  return children.length;
}

export function findSiblingDropTarget(
  document: UiDocument,
  rects: readonly RectInfo[],
  hoveredRect: RectInfo,
  pointerX: number,
  pointerY: number
): DropTarget | null {
  if (
    !hoveredRect.parentId ||
    hoveredRect.childIndex === undefined
  ) {
    return null;
  }

  const parent = document.nodes[hoveredRect.parentId];
  const display = parent?.props?.display === "flex" ? "flex" : "grid";
  const siblingRects = (parent?.children ?? [])
    .map((childId) => rects.find((candidate) => candidate.id === childId))
    .filter((rect): rect is RectInfo => Boolean(rect));
  const sameVisualRow = siblingRects.filter(
    (rect) => Math.abs(rect.top - hoveredRect.top) <= gridRowTolerance(hoveredRect, rect)
  );
  const gridIsMultiColumn = display === "grid" && sameVisualRow.length > 1;
  const insertAfter =
    display === "flex" || gridIsMultiColumn
      ? pointerX > hoveredRect.left + hoveredRect.width / 2
      : pointerY > hoveredRect.top + hoveredRect.height / 2;

  return {
    parentId: hoveredRect.parentId,
    insertIndex: hoveredRect.childIndex + (insertAfter ? 1 : 0),
  };
}

export function getDropIndicatorRect(
  document: UiDocument,
  rects: readonly RectInfo[],
  target: DropTarget | null
): DropIndicatorRect | null {
  if (!target) {
    return null;
  }

  const parent = document.nodes[target.parentId];
  const children = parent?.children ?? [];
  const isHorizontal = parent?.props?.display === "flex";
  const beforeRect = findRect(rects, children[target.insertIndex]);
  const previousRect = findRect(rects, children[target.insertIndex - 1]);
  const gridHasMultipleColumns =
    !isHorizontal && hasMultipleGridColumns(children, rects);

  if (beforeRect) {
    return isHorizontal || gridHasMultipleColumns
      ? {
          left: beforeRect.left - 2,
          top: beforeRect.top,
          width: 4,
          height: beforeRect.height,
        }
      : {
          left: beforeRect.left,
          top: beforeRect.top - 2,
          width: beforeRect.width,
          height: 4,
        };
  }

  if (previousRect) {
    return isHorizontal || gridHasMultipleColumns
      ? {
          left: previousRect.right - 2,
          top: previousRect.top,
          width: 4,
          height: previousRect.height,
        }
      : {
          left: previousRect.left,
          top: previousRect.bottom - 2,
          width: previousRect.width,
          height: 4,
        };
  }

  const parentRect = findRect(rects, target.parentId);
  if (!parentRect) {
    return null;
  }

  return isHorizontal
    ? {
        left: parentRect.left + 8,
        top: parentRect.top + 8,
        width: 4,
        height: Math.max(parentRect.height - 16, 24),
      }
    : {
        left: parentRect.left + 8,
        top: parentRect.top + 8,
        width: Math.max(parentRect.width - 16, 24),
        height: 4,
      };
}

function groupGridRows(
  positioned: ReadonlyArray<{ index: number; rect: RectInfo }>
): Array<Array<{ index: number; rect: RectInfo }>> {
  const rows: Array<Array<{ index: number; rect: RectInfo }>> = [];

  for (const item of positioned) {
    const row = rows.find((candidate) => {
      const anchor = candidate[0]?.rect;
      return anchor
        ? Math.abs(anchor.top - item.rect.top) <= gridRowTolerance(anchor, item.rect)
        : false;
    });

    if (row) {
      row.push(item);
    } else {
      rows.push([item]);
    }
  }

  rows.sort((left, right) => (left[0]?.rect.top ?? 0) - (right[0]?.rect.top ?? 0));
  for (const row of rows) {
    row.sort((left, right) => left.rect.left - right.rect.left);
  }
  return rows;
}

function gridRowTolerance(left: RectInfo, right: RectInfo) {
  return Math.max(6, Math.min(left.height, right.height) * 0.2);
}

function hasMultipleGridColumns(
  children: readonly NodeId[],
  rects: readonly RectInfo[]
): boolean {
  const childRects = children
    .map((childId) => findRect(rects, childId))
    .filter((rect): rect is RectInfo => Boolean(rect));

  return childRects.some((rect, index) =>
    childRects.some(
      (other, otherIndex) =>
        index !== otherIndex &&
        Math.abs(rect.top - other.top) <= gridRowTolerance(rect, other) &&
        Math.abs(rect.left - other.left) > 4
    )
  );
}

function findRect(
  rects: readonly RectInfo[],
  id: NodeId | undefined
) {
  return id ? rects.find((rect) => rect.id === id) : undefined;
}
