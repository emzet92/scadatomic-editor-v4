import { useEffect, useState } from "react";
import { useEditorStore } from "./editor-store";
import type { ComponentRegistry } from "./Renderer";

type RectInfo = {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
};

type Props = {
  registry: ComponentRegistry;
};

function Handle({
  x,
  y,
}: {
  x: number;
  y: number;
}) {
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

export function EditorControls({
  registry,
}: Props) {
  const [rects, setRects] = useState<RectInfo[]>([]);

  const nodes = useEditorStore(
    (s) => s.nodes
  );

  const selectedId = useEditorStore(
    (s) => s.selectedNodeId
  );

  const setSelectedNodeId = useEditorStore(
    (s) => s.setSelectedNodeId
  );

  const dragPreview = useEditorStore(
    (s) => s.dragPreview
  );

  const dragX = useEditorStore(
    (s) => s.dragX
  );

  const dragY = useEditorStore(
    (s) => s.dragY
  );

  function collectRects() {
    const next: RectInfo[] = [];

    document
      .querySelectorAll("[data-node-id]")
      .forEach((el) => {
        const id =
          el.getAttribute("data-node-id");

        if (!id) {
          return;
        }

        const rect =
          el.getBoundingClientRect();

        next.push({
          id,
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          right: rect.right,
          bottom: rect.bottom,
        });
      });

    setRects(next);
  }

  useEffect(() => {
    requestAnimationFrame(() => {
      collectRects();
    });
  }, [nodes]);

  useEffect(() => {
    collectRects();

    function handleClick(
      event: MouseEvent
    ) {
      const target =
        event.target as HTMLElement | null;

      if (!target) {
        return;
      }

      if (
        target.closest(
          "[data-editor-ignore]"
        )
      ) {
        return;
      }

      const node = target.closest(
        "[data-node-id]"
      );

      if (!node) {
        setSelectedNodeId(null);
        return;
      }

      const id =
        node.getAttribute(
          "data-node-id"
        );

      if (!id) {
        return;
      }

      setSelectedNodeId(id);
    }

    function handlePointerMove(
      event: PointerEvent
    ) {
      const state =
        useEditorStore.getState();

      if (!state.dragPreview) {
        return;
      }

      state.moveDrag(
        event.clientX,
        event.clientY
      );
    }

    function handlePointerUp() {
      useEditorStore
        .getState()
        .endComponentDrag();
    }

    document.addEventListener(
      "click",
      handleClick,
      true
    );

    window.addEventListener(
      "pointermove",
      handlePointerMove
    );

    window.addEventListener(
      "pointerup",
      handlePointerUp
    );

    window.addEventListener(
      "resize",
      collectRects
    );

    window.addEventListener(
      "scroll",
      collectRects,
      true
    );

    return () => {
      document.removeEventListener(
        "click",
        handleClick,
        true
      );

      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      window.removeEventListener(
        "pointerup",
        handlePointerUp
      );

      window.removeEventListener(
        "resize",
        collectRects
      );

      window.removeEventListener(
        "scroll",
        collectRects,
        true
      );
    };
  }, [setSelectedNodeId]);

  const selectedRect =
    rects.find(
      (r) => r.id === selectedId
    ) ?? null;

  const PreviewComponent =
    dragPreview
      ? registry[
          dragPreview.type
        ]
      : null;

  return (
    <>
      {/* DRAG PREVIEW */}

      {dragPreview &&
        PreviewComponent && (
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
            <PreviewComponent
              {...dragPreview.props}
            />
          </div>
        )}

      {/* OUTLINES */}

      {rects.map((rect) => (
        <div
          key={rect.id}
          style={{
            position: "fixed",
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            border:
              "1px dashed rgba(0,120,255,.25)",
            boxSizing: "border-box",
            pointerEvents: "none",
            zIndex: 9998,
          }}
        />
      ))}

      {/* SELECTED */}

      {selectedRect && (
        <>
          <div
            style={{
              position: "fixed",
              left: selectedRect.left,
              top: selectedRect.top,
              width: selectedRect.width,
              height: selectedRect.height,
              border:
                "2px solid #00aaff",
              boxSizing: "border-box",
              pointerEvents: "none",
              zIndex: 10000,
            }}
          />

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
        </>
      )}
    </>
  );
}