import { ChevronRight, FileText, Home, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { UiDocument } from "../../core/document";
import { collectPageSubtreeIds } from "../../core/pages";
import { useEditorStore } from "../../editor-store";
import {
  buildNavigationTree,
  type NavigationTreeNode,
} from "../../navigation/navigation";
import { ConfirmDialog, IconButton } from "../ui";

export function PageTree() {
  const document = useEditorStore((state) => state.document);
  const activePageId = useEditorStore((state) => state.activePageId);
  const setActivePageId = useEditorStore((state) => state.setActivePageId);
  const setStartPage = useEditorStore((state) => state.setStartPage);
  const addPage = useEditorStore((state) => state.addPage);
  const deletePage = useEditorStore((state) => state.deletePage);
  const [pendingDeletePageId, setPendingDeletePageId] = useState<string | null>(null);

  const tree = useMemo(() => buildNavigationTree(document), [document]);
  const pageCount = Object.keys(document.pages).length;
  const pendingDeletePage = pendingDeletePageId
    ? document.pages[pendingDeletePageId]
    : undefined;
  const pendingDeletePageIds = pendingDeletePage
    ? collectPageSubtreeIds(document, pendingDeletePage.id)
    : [];
  const pendingDescendantCount = Math.max(0, pendingDeletePageIds.length - 1);
  const canConfirmDelete =
    !!pendingDeletePage && pendingDeletePageIds.length < pageCount;

  return (
    <div data-editor-ignore className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">
          Pages
        </div>
        <IconButton
          aria-label="Add top-level page"
          title="Add top-level page"
          variant="secondary"
          onClick={() => addPage()}
        >
          <Plus size={14} />
        </IconButton>
      </div>

      <div className="space-y-0.5">
        {tree.map((node) => (
          <PageTreeRow
            key={node.pageId}
            node={node}
            depth={0}
            activePageId={activePageId}
            startPageId={document.startPageId}
            pageCount={pageCount}
            onOpen={setActivePageId}
            onSetStartPage={setStartPage}
            onAddChild={(pageId) => addPage(pageId)}
            onDelete={setPendingDeletePageId}
            document={document}
          />
        ))}
      </div>

      <ConfirmDialog
        open={!!pendingDeletePage}
        title={`Delete ${pendingDeletePage?.name ?? "page"}?`}
        description={
          pendingDescendantCount > 0
            ? `This will permanently remove this page, ${pendingDescendantCount} nested subpage${pendingDescendantCount === 1 ? "" : "s"}, and all of their UI nodes.`
            : "This will permanently remove this page and all of its UI nodes."
        }
        confirmLabel="Delete page"
        destructive
        onCancel={() => setPendingDeletePageId(null)}
        onConfirm={() => {
          if (pendingDeletePage && canConfirmDelete) {
            deletePage(pendingDeletePage.id);
          }
          setPendingDeletePageId(null);
        }}
      />
    </div>
  );
}

function PageTreeRow({
  node,
  depth,
  activePageId,
  startPageId,
  pageCount,
  onOpen,
  onSetStartPage,
  onAddChild,
  onDelete,
  document,
}: {
  node: NavigationTreeNode;
  depth: number;
  activePageId: string;
  startPageId: string;
  pageCount: number;
  onOpen(pageId: string): void;
  onSetStartPage(pageId: string): void;
  onAddChild(pageId: string): void;
  onDelete(pageId: string): void;
  document: UiDocument;
}) {
  const [expanded, setExpanded] = useState(true);
  const active = node.pageId === activePageId;
  const isStartPage = node.pageId === startPageId;
  const hasChildren = node.children.length > 0;
  const deleteCount = collectPageSubtreeIds(document, node.pageId).length;
  const canDelete = deleteCount > 0 && deleteCount < pageCount;

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
          aria-label={expanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
          onClick={() => setExpanded((value) => !value)}
          className={`inline-flex h-6 w-5 items-center justify-center text-[var(--editor-text-soft)] ${
            hasChildren ? "opacity-100" : "pointer-events-none opacity-0"
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
          {isStartPage ? (
            <Home size={12} className="shrink-0" />
          ) : (
            <FileText size={12} className="shrink-0 opacity-60" />
          )}
          <span className="truncate font-medium">{node.name}</span>
          {isStartPage ? (
            <span className="ml-auto rounded bg-[var(--editor-surface-muted)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--editor-text-muted)] group-hover:hidden">
              start
            </span>
          ) : null}
        </button>

        <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
          {!isStartPage ? (
            <IconButton
              aria-label={`Set ${node.name} as start page`}
              title={`Set ${node.name} as start page`}
              size="icon-xs"
              onClick={() => onSetStartPage(node.pageId)}
            >
              <Home size={12} />
            </IconButton>
          ) : null}
          <IconButton
            aria-label={`Add subpage under ${node.name}`}
            title={`Add subpage under ${node.name}`}
            size="icon-xs"
            onClick={() => onAddChild(node.pageId)}
          >
            <Plus size={12} />
          </IconButton>
          <IconButton
            aria-label={`Delete ${node.name}`}
            title={
              canDelete
                ? `Delete ${node.name}${deleteCount > 1 ? " and its subpages" : ""}`
                : "A project must contain at least one page"
            }
            variant="danger"
            size="icon-xs"
            disabled={!canDelete}
            onClick={() => onDelete(node.pageId)}
          >
            <Trash2 size={12} />
          </IconButton>
        </div>
      </div>

      {expanded
        ? node.children.map((child) => (
            <PageTreeRow
              key={child.pageId}
              node={child}
              depth={depth + 1}
              activePageId={activePageId}
              startPageId={startPageId}
              pageCount={pageCount}
              onOpen={onOpen}
              onSetStartPage={onSetStartPage}
              onAddChild={onAddChild}
              onDelete={onDelete}
              document={document}
            />
          ))
        : null}
    </div>
  );
}
