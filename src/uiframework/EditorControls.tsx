import { useEffect, useMemo, useRef, useState } from "react";
import { useEditorStore } from "./editor-store";
import type { ComponentRegistry } from "./registry/editor-registry";
import { getComponentDefinition } from "./registry/component-definitions";
import {
  collectNodeRects,
  findContainerInsertIndex,
  findDeepestRect,
  findSiblingDropTarget,
  getDropIndicatorRect,
  type DropTarget,
  type RectInfo,
} from "./editor/interaction/geometry";
import { DragPreview } from "./editor/overlay/DragPreview";
import {
  DropIndicator,
  NodeBoundsOverlay,
} from "./editor/overlay/DropOverlay";
import { SelectionOverlay } from "./editor/overlay/SelectionOverlay";

type Props = {
  registry: ComponentRegistry;
};

export function EditorControls({ registry }: Props) {
  const document = useEditorStore((state) => state.document);
  const selectedId = useEditorStore((state) => state.selectedNodeId);
  const selectedNodeIds = useEditorStore((state) => state.selectedNodeIds);
  const selectNode = useEditorStore((state) => state.selectNode);
  const dragPreview = useEditorStore((state) => state.dragPreview);
  const dragX = useEditorStore((state) => state.dragX);
  const dragY = useEditorStore((state) => state.dragY);

  const [rects, setRects] = useState<RectInfo[]>([]);
  const [hoverDropTarget, setHoverDropTargetState] =
    useState<DropTarget | null>(null);

  const rectsRef = useRef<RectInfo[]>([]);
  const hoverDropTargetRef = useRef<DropTarget | null>(null);

  function setHoverDropTarget(next: DropTarget | null) {
    hoverDropTargetRef.current = next;
    setHoverDropTargetState(next);
  }

  function collectRects() {
    const canvas = window.document.querySelector("[data-editor-canvas]");
    if (!canvas) {
      rectsRef.current = [];
      setRects([]);
      return;
    }

    const next = collectNodeRects(
      useEditorStore.getState().document,
      canvas
    );

    rectsRef.current = next;
    setRects(next);
  }

  useEffect(() => {
    const frame = requestAnimationFrame(collectRects);
    return () => cancelAnimationFrame(frame);
  }, [document]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target || target.closest("[data-editor-ignore]")) {
        return;
      }

      const node = target.closest<HTMLElement>("[data-node-id]");
      const id = node?.dataset.nodeId;
      selectNode(id ?? null, id ? {
        toggle: event.metaKey || event.ctrlKey,
        additive: event.shiftKey,
      } : undefined);
    }

    function handlePointerMove(event: PointerEvent) {
      const initialState = useEditorStore.getState();
      const isPotentialDrag =
        !!initialState.dragPreview ||
        !!initialState.draggedNodeId ||
        !!initialState.nodeDragCandidate;

      if (!isPotentialDrag) {
        setHoverDropTarget(null);
        return;
      }

      initialState.moveDrag(event.clientX, event.clientY);
      const state = useEditorStore.getState();

      if (!state.dragPreview && !state.draggedNodeId) {
        setHoverDropTarget(null);
        return;
      }

      const hoveredRect = findDeepestRect(
        rectsRef.current,
        event.clientX,
        event.clientY
      );

      if (!hoveredRect) {
        setHoverDropTarget(null);
        return;
      }

      const hoveredNode = state.document.nodes[hoveredRect.id];
      const hoveredDefinition = hoveredNode
        ? getComponentDefinition(hoveredNode.type)
        : undefined;

      if (hoveredNode && hoveredDefinition?.acceptsChildren) {
        setHoverDropTarget({
          parentId: hoveredNode.id,
          insertIndex: findContainerInsertIndex(
            state.document,
            rectsRef.current,
            hoveredNode.id,
            event.clientX,
            event.clientY
          ),
        });
        return;
      }

      setHoverDropTarget(
        findSiblingDropTarget(
          state.document,
          hoveredRect,
          event.clientX,
          event.clientY
        )
      );
    }

    function handlePointerUp() {
      const state = useEditorStore.getState();
      const target = hoverDropTargetRef.current;

      if (target && state.dragPreview) {
        state.insertNode(target.parentId, target.insertIndex, {
          type: state.dragPreview.type,
          props: state.dragPreview.props,
          componentDefinitionId: state.dragPreview.componentDefinitionId,
        });
      } else if (target && state.draggedNodeId) {
        state.moveNode(
          state.draggedNodeId,
          target.parentId,
          target.insertIndex
        );
      }

      state.endComponentDrag();
      state.endNodeDrag();
      setHoverDropTarget(null);
    }

    let collectFrame: number | null = null;

    function scheduleCollectRects() {
      if (collectFrame !== null) {
        cancelAnimationFrame(collectFrame);
      }

      collectFrame = requestAnimationFrame(() => {
        collectFrame = null;
        collectRects();
      });
    }

    window.document.addEventListener("click", handleClick, true);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("resize", scheduleCollectRects);
    window.addEventListener("scroll", scheduleCollectRects, true);

    return () => {
      window.document.removeEventListener("click", handleClick, true);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("resize", scheduleCollectRects);
      window.removeEventListener("scroll", scheduleCollectRects, true);

      if (collectFrame !== null) {
        cancelAnimationFrame(collectFrame);
      }
    };
  }, [selectNode]);

  const selectedRect = useMemo(
    () => rects.find((rect) => rect.id === selectedId) ?? null,
    [rects, selectedId]
  );

  const secondarySelectedRects = useMemo(
    () =>
      rects.filter(
        (rect) => rect.id !== selectedId && selectedNodeIds.includes(rect.id)
      ),
    [rects, selectedId, selectedNodeIds]
  );

  const dropIndicatorRect = useMemo(
    () => getDropIndicatorRect(document, rects, hoverDropTarget),
    [document, rects, hoverDropTarget]
  );

  const selectedNode = selectedId ? document.nodes[selectedId] : undefined;

  return (
    <>
      {dragPreview && (
        <DragPreview
          registry={registry}
          type={dragPreview.type}
          props={dragPreview.props}
          x={dragX}
          y={dragY}
        />
      )}

      <NodeBoundsOverlay rects={rects} dropTarget={hoverDropTarget} />
      <DropIndicator rect={dropIndicatorRect} />
      {secondarySelectedRects.map((rect) => (
        <div
          key={rect.id}
          style={{
            position: "fixed",
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            border: "1.5px solid #8b5cf6",
            boxShadow: "0 0 0 2px rgba(139,92,246,.10)",
            boxSizing: "border-box",
            pointerEvents: "none",
            zIndex: 9999,
          }}
        />
      ))}
      <SelectionOverlay
        rect={selectedRect}
        nodeType={selectedNode?.type}
        canDelete={!!selectedId && selectedId !== document.rootId}
        onDelete={() => {
          if (selectedId) {
            useEditorStore.getState().deleteNode(selectedId);
          }
        }}
      />
    </>
  );
}
