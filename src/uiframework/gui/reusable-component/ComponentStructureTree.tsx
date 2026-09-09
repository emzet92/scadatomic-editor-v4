import { ChevronRight, Layers3 } from "lucide-react";
import type { UiComponentDefinition } from "../../core/document";

export function ComponentStructureTree({
  definition,
  selectedNodeId,
  onSelect,
}: {
  definition: UiComponentDefinition;
  selectedNodeId: string;
  onSelect: (nodeId: string) => void;
}) {
  return (
    <div data-editor-ignore className="max-h-[42vh] overflow-auto bg-[var(--editor-surface)]">
      <div className="border-b border-[var(--editor-border)] px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">
          <Layers3 size={13} /> Component structure
        </div>
        <div className="mt-1 truncate text-sm font-medium text-[var(--editor-text)]">
          {definition.name}
        </div>
        <div className="mt-1 text-[10px] text-[var(--editor-text-muted)]">
          Private implementation
        </div>
      </div>
      <div className="p-2">
        <TreeNode
          definition={definition}
          nodeId={definition.rootId}
          selectedNodeId={selectedNodeId}
          onSelect={onSelect}
          depth={0}
        />
      </div>
    </div>
  );
}

function TreeNode({
  definition,
  nodeId,
  selectedNodeId,
  onSelect,
  depth,
}: {
  definition: UiComponentDefinition;
  nodeId: string;
  selectedNodeId: string;
  onSelect: (nodeId: string) => void;
  depth: number;
}) {
  const node = definition.nodes[nodeId];
  if (!node) return null;
  const children = node.children ?? [];

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        className={`flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left text-xs transition ${
          selectedNodeId === node.id
            ? "bg-violet-50 text-violet-700"
            : "text-[var(--editor-text)] hover:bg-[var(--editor-surface-muted)]"
        }`}
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        <ChevronRight
          size={11}
          className={children.length ? "text-zinc-400" : "opacity-0"}
        />
        <span className="min-w-0 flex-1 truncate font-medium">{node.name}</span>
        <span className="text-[9px] uppercase tracking-wide text-[var(--editor-text-muted)]">
          {node.type}
        </span>
      </button>
      {children.map((childId) => (
        <TreeNode
          key={childId}
          definition={definition}
          nodeId={childId}
          selectedNodeId={selectedNodeId}
          onSelect={onSelect}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
