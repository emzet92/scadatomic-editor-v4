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
  root: ParentNode
): RectInfo[] {
  const index = buildDocumentIndex(document);
  const result: RectInfo[] = [];

  root.querySelectorAll<HTMLElement>("[data-node-id]").forEach((element) => {
    const id = element.dataset.nodeId;
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
  const columns =
    typeof container?.props?.columns === "number"
      ? Math.max(1, Math.floor(container.props.columns))
      : 1;

  for (let index = 0; index < children.length; index += 1) {
    const rect = rects.find((candidate) => candidate.id === children[index]);
    if (!rect) {
      continue;
    }

    if (display === "flex") {
      if (pointerX < rect.left + rect.width / 2) {
        return index;
      }
      continue;
    }

    if (columns > 1) {
      const isAbove = pointerY < rect.top;
      const isSameRow = pointerY >= rect.top && pointerY <= rect.bottom;

      if (
        isAbove ||
        (isSameRow && pointerX < rect.left + rect.width / 2)
      ) {
        return index;
      }
      continue;
    }

    if (pointerY < rect.top + rect.height / 2) {
      return index;
    }
  }

  return children.length;
}

export function findSiblingDropTarget(
  document: UiDocument,
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
  const insertAfter =
    display === "flex"
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

  if (beforeRect) {
    return isHorizontal
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
    return isHorizontal
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

function findRect(
  rects: readonly RectInfo[],
  id: NodeId | undefined
) {
  return id ? rects.find((rect) => rect.id === id) : undefined;
}
