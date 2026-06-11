import { useEffect, useState } from "react";

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
  onSelect?: (id: string | null) => void;
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
  onSelect,
}: Props) {
  const [rects, setRects] = useState<RectInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function collectRects() {
    const next: RectInfo[] = [];

    document
      .querySelectorAll("[data-node-id]")
      .forEach((el) => {
        const id = el.getAttribute("data-node-id");

        if (!id) {
          return;
        }

        const rect = el.getBoundingClientRect();

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
    collectRects();

    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;

      if (!target) {
        return;
      }

      const node = target.closest("[data-node-id]");

      if (!node) {
        setSelectedId(null);
        onSelect?.(null);
        return;
      }

      const id = node.getAttribute("data-node-id");

      if (!id) {
        return;
      }

      setSelectedId(id);
      onSelect?.(id);
    }

    document.addEventListener(
      "click",
      handleClick,
      true
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
        "resize",
        collectRects
      );

      window.removeEventListener(
        "scroll",
        collectRects,
        true
      );
    };
  }, []);

  const selectedRect =
    rects.find(
      (r) => r.id === selectedId
    ) ?? null;

  return (
    <>
      {/* outline wszystkich komponentów */}

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

      {/* selected */}

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