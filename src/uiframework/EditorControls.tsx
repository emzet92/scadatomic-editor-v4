import { useEffect, useState } from "react";
import { Handle } from "./Handle";

type SelectionBox = {
    nodeId: string;
    top: number;
    left: number;
    width: number;
    height: number;
};

export function EditorControls() {
    const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);

    useEffect(() => {
        function updateSelectionBox(target: Element) {
            const nodeId = target.getAttribute("data-node-id");

            if (!nodeId) return;

            const rect = target.getBoundingClientRect();

            setSelectionBox({
                nodeId,
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
                height: rect.height,
            });
        }

        function handleClick(event: MouseEvent) {
            const target = event.target as HTMLElement | null;

            if (!target) return;

            const nodeEl = target.closest("[data-node-id]");

            if (!nodeEl) {
                setSelectionBox(null);
                return;
            }

            event.stopPropagation();
            updateSelectionBox(nodeEl);
        }

        function handleResizeOrScroll() {
            if (!selectionBox) return;

            const el = document.querySelector(
                `[data-node-id="${selectionBox.nodeId}"]`
            );

            if (!el) {
                setSelectionBox(null);
                return;
            }

            updateSelectionBox(el);
        }

        document.addEventListener("click", handleClick, true);
        window.addEventListener("resize", handleResizeOrScroll);
        window.addEventListener("scroll", handleResizeOrScroll, true);

        return () => {
            document.removeEventListener("click", handleClick, true);
            window.removeEventListener("resize", handleResizeOrScroll);
            window.removeEventListener("scroll", handleResizeOrScroll, true);
        };
    }, [selectionBox]);

    if (!selectionBox) {
        return null;
    }

    const HANDLE_SIZE = 10;

    return (
        <>
            <div
                style={{
                    position: "absolute",
                    top: selectionBox.top,
                    left: selectionBox.left,
                    width: selectionBox.width,
                    height: selectionBox.height,
                    border: "2px solid #00aaff",
                    boxSizing: "border-box",
                    pointerEvents: "none",
                    zIndex: 9999,
                }}
            />

            {/* NW */}
            <Handle
                x={selectionBox.left}
                y={selectionBox.top}
            />

            {/* NE */}
            <Handle
                x={selectionBox.left + selectionBox.width}
                y={selectionBox.top}
            />

            {/* SW */}
            <Handle
                x={selectionBox.left}
                y={selectionBox.top + selectionBox.height}
            />

            {/* SE */}
            <Handle
                x={selectionBox.left + selectionBox.width}
                y={selectionBox.top + selectionBox.height}
            />
        </>
    );
}