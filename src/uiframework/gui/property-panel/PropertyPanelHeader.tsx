import { useRef, useState } from "react";
import type { RenameNodeResult } from "../../editor-store";
import type { UiNode } from "./property-panel-types";

export function PropertyPanelHeader({
  node,
  renameNode,
}: {
  node: UiNode;
  renameNode: (nodeId: string, name: string) => RenameNodeResult;
}) {
  const [name, setName] = useState(node.name);
  const [error, setError] = useState<string | null>(null);
  const cancelBlurRef = useRef(false);

  function commitName() {
    if (cancelBlurRef.current) {
      cancelBlurRef.current = false;
      return;
    }

    if (name === node.name) {
      setError(null);
      return;
    }

    const result = renameNode(node.id, name);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setName(name.trim());
    setError(null);
  }

  return (
    <div
      className="
        px-4
        py-4
        border-b
        border-[var(--editor-border)]
        bg-[var(--editor-surface)]
      "
    >
      <div
        className="
          text-xs
          font-semibold
          uppercase
          tracking-wide
          text-[var(--editor-text-muted)]
        "
      >
        Component
      </div>

      <label className="mt-2 block">
        <span className="sr-only">Component name</span>
        <input
          value={name}
          spellCheck={false}
          autoComplete="off"
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
          onBlur={commitName}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }

            if (event.key === "Escape") {
              cancelBlurRef.current = true;
              setName(node.name);
              setError(null);
              event.currentTarget.blur();
            }
          }}
          className={`
            w-full
            rounded-md
            border
            bg-[var(--editor-surface)]
            px-2
            py-1.5
            text-sm
            font-semibold
            text-[var(--editor-text)]
            outline-none
            transition
            focus:ring-2
            focus:ring-blue-500/20
            ${
              error
                ? "border-red-500 focus:border-red-500"
                : "border-[var(--editor-border)] focus:border-blue-500"
            }
          `}
        />
      </label>

      {error && (
        <div className="mt-1 text-[11px] leading-4 text-red-600">
          {error}
        </div>
      )}

      <div
        className="
          mt-1
          text-xs
          text-[var(--editor-text-muted)]
          truncate
        "
      >
        {node.type}
      </div>
    </div>
  );
}
