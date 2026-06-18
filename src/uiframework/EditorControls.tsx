import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "./editor-store";
import type { ComponentRegistry } from "./Renderer";
import { Trash2 } from "lucide-react";

type RectInfo = {
  id: string;
  parentId?: string;
  childIndex?: number;
  depth: number;
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
};

type DropTarget = {
  parentId: string;
  insertIndex: number;
};

type Props = {
  registry: ComponentRegistry;
};

function Handle({ x, y }: { x: number; y: number }) {
  return (
    <div
      style={{
        position: "fixed",
        left: x - 4,
        top: y - 4,
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "#00aaff",
        border: "1px solid white",
        pointerEvents: "none",
        zIndex: 10001,
      }}
    />
  );
}

function findParentId(nodes: Record<string, any>, nodeId: string) {
  return Object.values(nodes).find((node: any) =>
    node.children?.includes(nodeId)
  )?.id as string | undefined;
}

function getDepth(nodes: Record<string, any>, nodeId: string): number {
  let depth = 0;
  let current = nodeId;

  while (true) {
    const parentId = findParentId(nodes, current);

    if (!parentId) {
      return depth;
    }

    depth += 1;
    current = parentId;
  }
}

export function EditorControls({ registry }: Props) {
  const [rects, setRects] = useState<RectInfo[]>([]);
  const [hoverDropTarget, setHoverDropTargetState] =
    useState<DropTarget | null>(null);

  const hoverDropTargetRef = useRef<DropTarget | null>(null);
  const rectsRef = useRef<RectInfo[]>([]);

  function setHoverDropTarget(next: DropTarget | null) {
    hoverDropTargetRef.current = next;
    setHoverDropTargetState(next);
  }

  function setCollectedRects(next: RectInfo[]) {
    rectsRef.current = next;
    setRects(next);
  }

  const nodes = useEditorStore((s) => s.nodes);
  const selectedId = useEditorStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useEditorStore((s) => s.setSelectedNodeId);
  const dragPreview = useEditorStore((s) => s.dragPreview);
  const dragX = useEditorStore((s) => s.dragX);
  const dragY = useEditorStore((s) => s.dragY);
  const draggedNodeId =
    useEditorStore(
      (s) => s.draggedNodeId
    );

  const moveNode =
    useEditorStore(
      (s) => s.moveNode
    );

  const endNodeDrag =
    useEditorStore(
      (s) => s.endNodeDrag
    );

  function collectRects() {
    const state = useEditorStore.getState();
    const currentNodes = state.nodes;
    const next: RectInfo[] = [];

    document.querySelectorAll("[data-node-id]").forEach((el) => {
      const id = el.getAttribute("data-node-id");

      if (!id) {
        return;
      }

      const parentId = findParentId(currentNodes, id);
      const parent = parentId ? currentNodes[parentId] : undefined;
      const rect = el.getBoundingClientRect();

      next.push({
        id,
        parentId,
        childIndex: parent?.children?.indexOf(id),
        depth: getDepth(currentNodes, id),
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
      });
    });

    setCollectedRects(next);
  }

  function findDeepestRect(
    x: number,
    y: number
  ): RectInfo | null {
    const currentRects =
      rectsRef.current;

    const candidates =
      currentRects.filter(
        (rect) =>
          x >= rect.left &&
          x <= rect.right &&
          y >= rect.top &&
          y <= rect.bottom
      );

    if (!candidates.length) {
      return null;
    }

    candidates.sort(
      (a, b) => b.depth - a.depth
    );

    return candidates[0];
  }

  function getDropLineRect(target: DropTarget | null) {
    if (!target) {
      return null;
    }

    const currentRects = rectsRef.current;
    const state = useEditorStore.getState();
    const parent = state.nodes[target.parentId];
    const children = parent?.children ?? [];

    const beforeChildId = children[target.insertIndex];
    const previousChildId = children[target.insertIndex - 1];

    if (beforeChildId) {
      const beforeRect = currentRects.find((r) => r.id === beforeChildId);
      if (beforeRect) {
        return {
          left: beforeRect.left,
          top: beforeRect.top - 2,
          width: beforeRect.width,
        };
      }
    }

    if (previousChildId) {
      const previousRect = currentRects.find((r) => r.id === previousChildId);
      if (previousRect) {
        return {
          left: previousRect.left,
          top: previousRect.bottom - 2,
          width: previousRect.width,
        };
      }
    }

    const parentRect = currentRects.find((r) => r.id === target.parentId);
    if (parentRect) {
      return {
        left: parentRect.left + 8,
        top: parentRect.top + 8,
        width: Math.max(parentRect.width - 16, 24),
      };
    }

    return null;
  }

  function findInsertIndex(
    containerId: string,
    mouseY: number
  ) {
    const state =
      useEditorStore.getState();

    const container =
      state.nodes[containerId];

    const children =
      container.children ?? [];

    for (
      let i = 0;
      i < children.length;
      i++
    ) {
      const childId =
        children[i];

      const rect =
        rectsRef.current.find(
          (r) => r.id === childId
        );

      if (!rect) {
        continue;
      }

      const middle =
        rect.top +
        rect.height / 2;

      if (mouseY < middle) {
        return i;
      }
    }

    return children.length;
  }

  useEffect(() => {
    requestAnimationFrame(() => {
      collectRects();
    });
  }, [nodes]);

  useEffect(() => {
    collectRects();

    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;

      if (!target) {
        return;
      }

      if (target.closest("[data-editor-ignore]")) {
        return;
      }

      const node = target.closest("[data-node-id]");

      if (!node) {
        setSelectedNodeId(null);
        return;
      }

      const id = node.getAttribute("data-node-id");

      if (!id) {
        return;
      }

      setSelectedNodeId(id);
    }

    function handlePointerMove(event: PointerEvent) {
      const state = useEditorStore.getState();

      const isDraggingComponent = !!state.dragPreview;
      const isDraggingNode = !!state.draggedNodeId;

      if (!isDraggingComponent && !isDraggingNode) {
        setHoverDropTarget(null);
        return;
      }

      state.moveDrag(event.clientX, event.clientY);

      const hoveredRect = findDeepestRect(
        event.clientX,
        event.clientY
      );

      if (!hoveredRect) {
        setHoverDropTarget(null);
        return;
      }

      const node = state.nodes[hoveredRect.id];

      if (node?.type === "Container") {
        const insertIndex = findInsertIndex(
          node.id,
          event.clientY
        );

        setHoverDropTarget({
          parentId: node.id,
          insertIndex,
        });

        return;
      }

      if (
        hoveredRect.parentId &&
        hoveredRect.childIndex !== undefined
      ) {
        const insertAfter =
          event.clientY >
          hoveredRect.top + hoveredRect.height / 2;

        setHoverDropTarget({
          parentId: hoveredRect.parentId,
          insertIndex:
            hoveredRect.childIndex + (insertAfter ? 1 : 0),
        });

        return;
      }

      setHoverDropTarget(null);
    }

    function handlePointerUp() {
      const state = useEditorStore.getState();
      const target = hoverDropTargetRef.current;

      if (!target) {
        state.endComponentDrag();
        state.endNodeDrag();
        setHoverDropTarget(null);
        return;
      }

      if (state.dragPreview) {
        state.insertNode(target.parentId, target.insertIndex, {
          type: state.dragPreview.type,
          props: state.dragPreview.props,
        });

        setHoverDropTarget(null);
        return;
      }

      if (state.draggedNodeId) {
        state.moveNode(
          state.draggedNodeId,
          target.parentId,
          target.insertIndex
        );

        setHoverDropTarget(null);
        return;
      }

      setHoverDropTarget(null);
    }

    document.addEventListener("click", handleClick, true);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("resize", collectRects);
    window.addEventListener("scroll", collectRects, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("resize", collectRects);
      window.removeEventListener("scroll", collectRects, true);
    };
  }, [setSelectedNodeId]);

  const selectedRect = rects.find((r) => r.id === selectedId) ?? null;
  const PreviewComponent = dragPreview ? registry[dragPreview.type] : null;
  const dropLineRect = getDropLineRect(hoverDropTarget);

  return (
    <>
      {dragPreview && PreviewComponent && (
        <div
          style={{
            position: "fixed",
            left: dragX + 12,
            top: dragY + 12,
            zIndex: 99999,
            pointerEvents: "none",
            opacity: 0.75,
          }}
        >
          <PreviewComponent {...dragPreview.props} />
        </div>
      )}

      {rects.map((rect) => (
        <div
          key={rect.id}
          style={{
            position: "fixed",
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            border: "1px dashed rgba(0,120,255,.25)",
            boxSizing: "border-box",
            pointerEvents: "none",
            zIndex: 9998,
            background:
              hoverDropTarget?.parentId === rect.id
                ? "rgba(0,170,255,.08)"
                : undefined,
          }}
        />
      ))}

      {dropLineRect && (
        <div
          style={{
            position: "fixed",
            left: dropLineRect.left,
            top: dropLineRect.top,
            width: dropLineRect.width,
            height: 4,
            background: "#00aaff",
            borderRadius: 999,
            pointerEvents: "none",
            zIndex: 20000,
          }}
        />
      )}

      {selectedRect && selectedId && (
        <>
          {/* LABEL */}

          <div
            style={{
              position: "fixed",
              left: selectedRect.left,
              top: selectedRect.top - 28,
              display: "flex",
              alignItems: "center",
              gap: 4,
              zIndex: 10002,
            }}
          >
            <div
              style={{
                height: 24,
                padding: "0 8px",
                borderRadius: 6,
                background: "#0ea5e9",
                color: "white",
                fontSize: 12,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
              }}
            >
              {nodes[selectedId]?.type}
            </div>

            <button
              data-editor-ignore
              onClick={() => {
                useEditorStore
                  .getState()
                  .deleteNode(
                    selectedId
                  );
              }}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                border:
                  "1px solid #e4e4e7",
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "center",
                cursor: "pointer",
                color: "#ef4444",
                boxShadow:
                  "0 1px 2px rgba(0,0,0,.08)",
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* SELECTION */}

          <div
            style={{
              position: "fixed",
              left: selectedRect.left,
              top: selectedRect.top,
              width: selectedRect.width,
              height: selectedRect.height,
              border:
                "2px solid #00aaff",
              boxSizing:
                "border-box",
              pointerEvents: "none",
              zIndex: 10000,
            }}
          />
          {/* HEIGHT WIDTH LABELS */}
          {selectedRect && (
            <div
              style={{
                position: "fixed",
                left:
                  selectedRect.left +
                  selectedRect.width / 2 - 20,
                top:
                  selectedRect.top - 20,
                fontSize: 11,
                background: "#0ea5e9",
                color: "white",
                padding: "2px 6px",
                borderRadius: 4,
                zIndex: 10003,
              }}
            >
              {Math.round(
                selectedRect.width
              )}px
            </div>
          )}

          {selectedRect && (
            <div
              style={{
                position: "fixed",

                left:
                  selectedRect.left - 50,

                top:
                  selectedRect.top +
                  selectedRect.height / 2 - 10,

                fontSize: 11,

                background: "#0ea5e9",

                color: "white",

                padding: "2px 6px",

                borderRadius: 4,

                zIndex: 10003,
              }}
            >
              {Math.round(
                selectedRect.height
              )}px
            </div>
          )}

          {/* CORNERS */}

          <Handle
            x={selectedRect.left}
            y={selectedRect.top}
          />

          <Handle
            x={selectedRect.right}
            y={selectedRect.top}
          />

          <Handle
            x={selectedRect.left}
            y={selectedRect.bottom}
          />

          <Handle
            x={selectedRect.right}
            y={selectedRect.bottom}
          />

          {/* TOP */}

          <Handle
            x={
              selectedRect.left +
              selectedRect.width / 2
            }
            y={selectedRect.top}
          />

          {/* BOTTOM */}

          <Handle
            x={
              selectedRect.left +
              selectedRect.width / 2
            }
            y={selectedRect.bottom}
          />

          {/* LEFT */}

          <Handle
            x={selectedRect.left}
            y={
              selectedRect.top +
              selectedRect.height /
              2
            }
          />

          {/* RIGHT */}

          <Handle
            x={selectedRect.right}
            y={
              selectedRect.top +
              selectedRect.height /
              2
            }
          />
        </>
      )}
    </>
  );
}