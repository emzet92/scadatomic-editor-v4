import { useEffect, useMemo, useRef, useState } from "react";
import { useEditorStore } from "../editor-store";
import {
  collectNodeRects,
  findContainerInsertIndex,
  findDeepestRect,
  findSiblingDropTarget,
  getDropIndicatorRect,
  type DropTarget,
  type RectInfo,
} from "../editor/interaction/geometry";
import { DragPreview } from "../editor/overlay/DragPreview";
import {
  DropIndicator,
  NodeBoundsOverlay,
} from "../editor/overlay/DropOverlay";
import { SelectionOverlay } from "../editor/overlay/SelectionOverlay";
import { getComponentDefinition } from "../registry/component-definitions";
import type { ComponentRegistry } from "../registry/editor-registry";
import type { DesignerAdapter } from "./designer-adapter";

export function DesignerSurface({
  adapter,
  registry,
}: {
  adapter: DesignerAdapter;
  registry: ComponentRegistry;
}) {
  const dragPreview = useEditorStore((state) => state.dragPreview);
  const dragX = useEditorStore((state) => state.dragX);
  const dragY = useEditorStore((state) => state.dragY);

  const [rects, setRects] = useState<RectInfo[]>([]);
  const [hoverDropTarget, setHoverDropTargetState] =
    useState<DropTarget | null>(null);

  const adapterRef = useRef(adapter);
  const rectsRef = useRef<RectInfo[]>([]);
  const hoverDropTargetRef = useRef<DropTarget | null>(null);
  adapterRef.current = adapter;

  function setHoverDropTarget(next: DropTarget | null) {
    hoverDropTargetRef.current = next;
    setHoverDropTargetState(next);
  }

  function collectRects() {
    const currentAdapter = adapterRef.current;
    const canvas = window.document.querySelector(currentAdapter.canvasSelector);
    if (!canvas) {
      rectsRef.current = [];
      setRects([]);
      return;
    }

    const snapshot = currentAdapter.read();
    const next = collectNodeRects(
      snapshot.document,
      canvas,
      currentAdapter.nodeIdAttribute
    );

    rectsRef.current = next;
    setRects(next);
  }

  useEffect(() => {
    const frame = requestAnimationFrame(collectRects);
    return () => cancelAnimationFrame(frame);
  }, [adapter.key, adapter.snapshot.document]);

  useEffect(() => {
    function getCanvasElement() {
      return window.document.querySelector<HTMLElement>(
        adapterRef.current.canvasSelector
      );
    }

    function getCanvasTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return null;
      if (target.closest("[data-editor-ignore]")) return null;

      const canvas = getCanvasElement();
      if (!canvas || !canvas.contains(target)) return null;

      return { canvas, target };
    }

    function findNodeElement(target: EventTarget | null) {
      const canvasTarget = getCanvasTarget(target);
      if (!canvasTarget) return null;

      const element = canvasTarget.target.closest<HTMLElement>(
        `[${adapterRef.current.nodeIdAttribute}]`
      );
      return element && canvasTarget.canvas.contains(element) ? element : null;
    }

    function readNodeId(element: HTMLElement | null) {
      return element?.getAttribute(adapterRef.current.nodeIdAttribute) ?? null;
    }

    function handleClick(event: MouseEvent) {
      const canvasTarget = getCanvasTarget(event.target);
      if (!canvasTarget) return;

      const nodeId = readNodeId(findNodeElement(event.target));
      adapterRef.current.selectNode(
        nodeId,
        nodeId
          ? {
              toggle: event.metaKey || event.ctrlKey,
              additive: event.shiftKey,
            }
          : undefined
      );
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey
      ) {
        return;
      }

      const nodeId = readNodeId(findNodeElement(event.target));
      if (!nodeId || !adapterRef.current.read().document.nodes[nodeId]) return;

      useEditorStore
        .getState()
        .startNodeDragCandidate(nodeId, event.clientX, event.clientY);
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

      const snapshot = adapterRef.current.read();
      const hoveredRect = findDeepestRect(
        rectsRef.current,
        event.clientX,
        event.clientY
      );

      if (!hoveredRect) {
        setHoverDropTarget(null);
        return;
      }

      const hoveredNode = snapshot.document.nodes[hoveredRect.id];
      const hoveredDefinition = hoveredNode
        ? getComponentDefinition(hoveredNode.type)
        : undefined;

      if (hoveredNode && hoveredDefinition?.acceptsChildren) {
        setHoverDropTarget({
          parentId: hoveredNode.id,
          insertIndex: findContainerInsertIndex(
            snapshot.document,
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
          snapshot.document,
          hoveredRect,
          event.clientX,
          event.clientY
        )
      );
    }

    function handlePointerUp() {
      const state = useEditorStore.getState();
      const currentAdapter = adapterRef.current;
      const target = hoverDropTargetRef.current;

      if (target && state.dragPreview) {
        currentAdapter.insertNode(target.parentId, target.insertIndex, {
          type: state.dragPreview.type,
          props: state.dragPreview.props,
          ...(state.dragPreview.componentDefinitionId
            ? { componentDefinitionId: state.dragPreview.componentDefinitionId }
            : {}),
        });
      } else if (
        target &&
        state.draggedNodeId &&
        currentAdapter.canMoveNode(state.draggedNodeId)
      ) {
        currentAdapter.moveNode(
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
      if (collectFrame !== null) cancelAnimationFrame(collectFrame);
      collectFrame = requestAnimationFrame(() => {
        collectFrame = null;
        collectRects();
      });
    }

    window.document.addEventListener("click", handleClick, true);
    window.document.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("resize", scheduleCollectRects);
    window.addEventListener("scroll", scheduleCollectRects, true);

    return () => {
      window.document.removeEventListener("click", handleClick, true);
      window.document.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("resize", scheduleCollectRects);
      window.removeEventListener("scroll", scheduleCollectRects, true);
      if (collectFrame !== null) cancelAnimationFrame(collectFrame);
    };
  }, [adapter.key]);

  const { snapshot } = adapter;
  const selectedRect = useMemo(
    () =>
      rects.find((rect) => rect.id === snapshot.selectedNodeId) ?? null,
    [rects, snapshot.selectedNodeId]
  );

  const secondarySelectedRects = useMemo(
    () =>
      rects.filter(
        (rect) =>
          rect.id !== snapshot.selectedNodeId &&
          snapshot.selectedNodeIds.includes(rect.id)
      ),
    [rects, snapshot.selectedNodeId, snapshot.selectedNodeIds]
  );

  const dropIndicatorRect = useMemo(
    () =>
      getDropIndicatorRect(snapshot.document, rects, hoverDropTarget),
    [snapshot.document, rects, hoverDropTarget]
  );

  const selectedNode = snapshot.selectedNodeId
    ? snapshot.document.nodes[snapshot.selectedNodeId]
    : undefined;

  return (
    <>
      {dragPreview ? (
        <DragPreview
          registry={registry}
          type={dragPreview.type}
          props={dragPreview.props}
          label={dragPreview.label}
          x={dragX}
          y={dragY}
        />
      ) : null}

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
        canDelete={
          !!snapshot.selectedNodeId &&
          adapter.canDeleteNode(snapshot.selectedNodeId)
        }
        onDelete={() => {
          const nodeId = adapterRef.current.read().selectedNodeId;
          if (nodeId && adapterRef.current.canDeleteNode(nodeId)) {
            adapterRef.current.deleteNode(nodeId);
          }
        }}
      />
    </>
  );
}
