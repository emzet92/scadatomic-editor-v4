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

export function EditorControls() {
    const [rects, setRects] = useState<RectInfo[]>([]);
    const [selection, setSelection] = useState<RectInfo | null>(null);

    useEffect(() => {
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

            setSelection((current) => {
                if (!current) {
                    return current;
                }

                const updated = next.find((r) => r.id === current.id);

                return updated ?? null;
            });
        }

        function handleClick(event: MouseEvent) {
            const target = event.target as HTMLElement | null;

            if (!target) {
                return;
            }

            const node = target.closest("[data-node-id]");

            if (!node) {
                setSelection(null);
                return;
            }

            const id = node.getAttribute("data-node-id");

            if (!id) {
                return;
            }

            const rect = node.getBoundingClientRect();

            setSelection({
                id,
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
                right: rect.right,
                bottom: rect.bottom,
            });
        }

        collectRects();

        document.addEventListener("click", handleClick, true);

        window.addEventListener("resize", collectRects);
        window.addEventListener("scroll", collectRects, true);

        const observer = new MutationObserver(collectRects);

        observer.observe(document.body, {
            subtree: true,
            childList: true,
            attributes: true,
        });

        return () => {
            document.removeEventListener("click", handleClick, true);

            window.removeEventListener("resize", collectRects);
            window.removeEventListener("scroll", collectRects, true);

            observer.disconnect();
        };
    }, []);

    return (
        <>
            {/* OUTLINES WSZYSTKICH KOMPONENTÓW */}

            {rects.map((rect) => (
                <div
                    key={rect.id}
                    style={{
                        position: "fixed",
                        left: rect.left,
                        top: rect.top,
                        width: rect.width,
                        height: rect.height,
                        border: "2px dashed rgba(0,120,255,.25)",
                        boxSizing: "border-box",
                        pointerEvents: "none",
                        zIndex: 9998,
                    }}
                />
            ))}

            {/* ZAZNACZONY KOMPONENT */}

            {selection && (
                <>
                    <div
                        style={{
                            position: "fixed",
                            left: selection.left,
                            top: selection.top,
                            width: selection.width,
                            height: selection.height,
                            border: "2px solid #00aaff",
                            boxSizing: "border-box",
                            pointerEvents: "none",
                            zIndex: 10000,
                        }}
                    />

                    <Handle
                        x={selection.left}
                        y={selection.top}
                    />

                    <Handle
                        x={selection.right}
                        y={selection.top}
                    />

                    <Handle
                        x={selection.left}
                        y={selection.bottom}
                    />

                    <Handle
                        x={selection.right}
                        y={selection.bottom}
                    />
                </>
            )}
        </>
    );
}