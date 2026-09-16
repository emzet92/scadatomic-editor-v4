import { useRef, useState } from "react";
import type { RenameNodeResult } from "../../editor-store";
import type { UiNode } from "./property-panel-types";
import { TextInput,
  Box,
} from "../ui";

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
    <Box
      className="
        px-4
        py-4
        border-b
        border-[var(--editor-border)]
        bg-[var(--editor-surface)]
      "
    >
      <Box
        className="
          text-xs
          font-semibold
          uppercase
          tracking-wide
          text-[var(--editor-text-muted)]
        "
      >
        Component
      </Box>

      <label className="mt-2 block">
        <span className="sr-only">Component name</span>
        <TextInput
          value={name}
          spellCheck={false}
          autoComplete="off"
          invalid={Boolean(error)}
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
          className="font-semibold"
        />
      </label>

      {error && (
        <Box className="mt-1 text-[11px] leading-4 text-red-600">
          {error}
        </Box>
      )}

      <Box
        className="
          mt-1
          text-xs
          text-[var(--editor-text-muted)]
          truncate
        "
      >
        {node.type}
      </Box>
    </Box>
  );
}
