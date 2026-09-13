import { ChevronRight, Layers3, Trash2 } from "lucide-react";
import type { UiComponentDefinition } from "../../core/document";

export function ComponentStructureTree({
  definition,
  selectedNodeId,
  onSelect,
  onDelete,
}: {
  definition: UiComponentDefinition;
  selectedNodeId: string;
  onSelect: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
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
          onDelete={onDelete}
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
  onDelete,
  depth,
}: {
  definition: UiComponentDefinition;
  nodeId: string;
  selectedNodeId: string;
  onSelect: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  depth: number;
}) {
  const node = definition.nodes[nodeId];
  if (!node) return null;
  const children = node.children ?? [];
  const canDelete = node.id !== definition.rootId;

  return (
    <div>
      <div
        className={`group flex w-full items-center gap-1 rounded-md pr-1 transition ${
          selectedNodeId === node.id
            ? "bg-violet-50 text-violet-700"
            : "text-[var(--editor-text)] hover:bg-[var(--editor-surface-muted)]"
        }`}
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left text-xs"
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

        {canDelete ? (
          <button
            type="button"
            aria-label={`Delete ${node.name}`}
            title="Delete"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(node.id);
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--editor-text-soft)] opacity-0 transition hover:bg-red-50 hover:text-[var(--editor-danger)] group-hover:opacity-100 focus:opacity-100"
          >
            <Trash2 size={13} />
          </button>
        ) : null}
      </div>

      {children.map((childId) => (
        <TreeNode
          key={childId}
          definition={definition}
          nodeId={childId}
          selectedNodeId={selectedNodeId}
          onSelect={onSelect}
          onDelete={onDelete}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
