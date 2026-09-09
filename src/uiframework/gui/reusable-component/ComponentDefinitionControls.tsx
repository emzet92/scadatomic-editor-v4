import { useEffect, useMemo, useRef, useState } from "react";
import type { UiComponentDefinition, UiDocument } from "../../core/document";
import { useEditorStore } from "../../editor-store";
import {
  collectNodeRects,
  findContainerInsertIndex,
  findDeepestRect,
  findSiblingDropTarget,
  getDropIndicatorRect,
  type DropTarget,
  type RectInfo,
} from "../../editor/interaction/geometry";
import { DragPreview } from "../../editor/overlay/DragPreview";
import {
  DropIndicator,
  NodeBoundsOverlay,
} from "../../editor/overlay/DropOverlay";
import { SelectionOverlay } from "../../editor/overlay/SelectionOverlay";
import { getComponentDefinition } from "../../registry/component-definitions";
import type { ComponentRegistry } from "../../registry/editor-registry";
import { createComponentDefinitionDocument } from "../../reusable-components";

export function ComponentDefinitionControls({
  projectDocument,
  definition,
  registry,
  selectedNodeId,
  onSelectNode,
}: {
  projectDocument: UiDocument;
  definition: UiComponentDefinition;
  registry: ComponentRegistry;
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
}) {
  const dragPreview = useEditorStore((state) => state.dragPreview);
  const dragX = useEditorStore((state) => state.dragX);
  const dragY = useEditorStore((state) => state.dragY);
  const document = useMemo(
    () => createComponentDefinitionDocument(projectDocument, definition),
    [projectDocument, definition]
  );

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
    const canvas = window.document.querySelector(
      "[data-editor-component-canvas]"
    );
    if (!canvas) {
      rectsRef.current = [];
      setRects([]);
      return;
    }

    const next = collectNodeRects(
      createComponentDefinitionDocument(
        useEditorStore.getState().document,
        useEditorStore.getState().document.components?.[definition.id] ?? definition
      ),
      canvas,
      "data-component-node-id"
    );
    rectsRef.current = next;
    setRects(next);
  }

  useEffect(() => {
    const frame = requestAnimationFrame(collectRects);
    return () => cancelAnimationFrame(frame);
  }, [definition, projectDocument]);

  useEffect(() => {
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

      const currentDefinition = state.document.components?.[definition.id];
      if (!currentDefinition) return;
      const currentDocument = createComponentDefinitionDocument(
        state.document,
        currentDefinition
      );
      const hoveredRect = findDeepestRect(
        rectsRef.current,
        event.clientX,
        event.clientY
      );

      if (!hoveredRect) {
        setHoverDropTarget(null);
        return;
      }

      const hoveredNode = currentDocument.nodes[hoveredRect.id];
      const hoveredDefinition = hoveredNode
        ? getComponentDefinition(hoveredNode.type)
        : undefined;

      if (hoveredNode && hoveredDefinition?.acceptsChildren) {
        setHoverDropTarget({
          parentId: hoveredNode.id,
          insertIndex: findContainerInsertIndex(
            currentDocument,
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
          currentDocument,
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
        const insertedId = state.insertComponentDefinitionNode(
          definition.id,
          target.parentId,
          target.insertIndex,
          {
            type: state.dragPreview.type,
            props: state.dragPreview.props,
            componentDefinitionId: state.dragPreview.componentDefinitionId,
          }
        );
        if (insertedId) onSelectNode(insertedId);
      } else if (
        target &&
        state.draggedNodeId &&
        state.draggedNodeId !== definition.rootId
      ) {
        state.moveComponentDefinitionNode(
          definition.id,
          state.draggedNodeId,
          target.parentId,
          target.insertIndex
        );
        onSelectNode(state.draggedNodeId);
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

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("resize", scheduleCollectRects);
    window.addEventListener("scroll", scheduleCollectRects, true);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("resize", scheduleCollectRects);
      window.removeEventListener("scroll", scheduleCollectRects, true);
      if (collectFrame !== null) cancelAnimationFrame(collectFrame);
    };
  }, [definition.id, definition.rootId, onSelectNode]);

  const selectedRect = useMemo(
    () => rects.find((rect) => rect.id === selectedNodeId) ?? null,
    [rects, selectedNodeId]
  );
  const selectedNode = definition.nodes[selectedNodeId];
  const dropIndicatorRect = useMemo(
    () => getDropIndicatorRect(document, rects, hoverDropTarget),
    [document, rects, hoverDropTarget]
  );

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
      <SelectionOverlay
        rect={selectedRect}
        nodeType={selectedNode?.type}
        canDelete={selectedNodeId !== definition.rootId}
        onDelete={() => {
          if (selectedNodeId === definition.rootId) return;
          useEditorStore
            .getState()
            .deleteComponentDefinitionNode(definition.id, selectedNodeId);
          onSelectNode(definition.rootId);
        }}
      />

    </>
  );
}
