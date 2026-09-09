import type { MouseEvent } from "react";
import type { TreeSelectionOptions } from "./tree-view-types";

export function TreeNodeLabel({
  nodeId,
  name,
  type,
  selectNode,
}: {
  nodeId: string;
  name: string;
  type: string;
  selectNode: (nodeId: string, options?: TreeSelectionOptions) => void;
}) {
  function handleClick(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
    selectNode(nodeId, {
      toggle: event.metaKey || event.ctrlKey,
      additive: event.shiftKey,
    });
  }

  return (
    <div
      className="flex-1 min-w-0 truncate text-sm"
      onClick={handleClick}
      title={`${name} · ${type}`}
    >
      {name}
    </div>
  );
}
