import { ChevronRight, FilePlus2, Home, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useEditorStore } from "../../editor-store";
import { buildNavigationTree, type NavigationTreeNode } from "../../navigation/navigation";

export function PageTree() {
  const document = useEditorStore((state) => state.document);
  const activePageId = useEditorStore((state) => state.activePageId);
  const setActivePageId = useEditorStore((state) => state.setActivePageId);
  const addPage = useEditorStore((state) => state.addPage);
  const tree = useMemo(() => buildNavigationTree(document), [document]);

  return (
    <div data-editor-ignore className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs uppercase tracking-wide font-semibold text-[var(--editor-text-muted)]">
          Pages
        </div>
        <button
          type="button"
          title="Add top-level page"
          onClick={() => addPage()}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface)] text-[var(--editor-text-muted)] hover:bg-[var(--editor-accent-soft)] hover:text-[var(--editor-accent)]"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="space-y-0.5">
        {tree.map((node) => (
          <PageTreeRow
            key={node.pageId}
            node={node}
            depth={0}
            activePageId={activePageId}
            startPageId={document.startPageId}
            onOpen={setActivePageId}
            onAddChild={(pageId) => addPage(pageId)}
          />
        ))}
      </div>
    </div>
  );
}

function PageTreeRow({
  node,
  depth,
  activePageId,
  startPageId,
  onOpen,
  onAddChild,
}: {
  node: NavigationTreeNode;
  depth: number;
  activePageId: string;
  startPageId: string;
  onOpen(pageId: string): void;
  onAddChild(pageId: string): void;
}) {
  const [expanded, setExpanded] = useState(true);
  const active = node.pageId === activePageId;
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={`group flex h-8 items-center rounded-md pr-1 text-xs transition ${
          active
            ? "bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]"
            : "text-[var(--editor-text)] hover:bg-[var(--editor-surface)]"
        }`}
        style={{ paddingLeft: 4 + depth * 14 }}
      >
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className={`inline-flex h-6 w-5 items-center justify-center text-[var(--editor-text-soft)] ${
            hasChildren ? "opacity-100" : "opacity-0"
          }`}
          tabIndex={hasChildren ? 0 : -1}
        >
          <ChevronRight
            size={12}
            className={`transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </button>

        <button
          type="button"
          onClick={() => onOpen(node.pageId)}
          className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left"
        >
          {node.pageId === startPageId ? (
            <Home size={12} className="shrink-0" />
          ) : (
            <FilePlus2 size={12} className="shrink-0 opacity-60" />
          )}
          <span className="truncate font-medium">{node.name}</span>
          {node.pageId === startPageId ? (
            <span className="ml-auto rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-500">
              start
            </span>
          ) : null}
        </button>

        <button
          type="button"
          title={`Add subpage under ${node.name}`}
          onClick={() => onAddChild(node.pageId)}
          className="inline-flex h-6 w-6 items-center justify-center rounded text-[var(--editor-text-soft)] opacity-0 hover:bg-white hover:text-[var(--editor-accent)] group-hover:opacity-100"
        >
          <Plus size={12} />
        </button>
      </div>

      {expanded
        ? node.children.map((child) => (
            <PageTreeRow
              key={child.pageId}
              node={child}
              depth={depth + 1}
              activePageId={activePageId}
              startPageId={startPageId}
              onOpen={onOpen}
              onAddChild={onAddChild}
            />
          ))
        : null}
    </div>
  );
}
