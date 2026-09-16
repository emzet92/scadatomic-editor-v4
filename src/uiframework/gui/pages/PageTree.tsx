import {
  ChevronRight,
  FileText,
  Home,
  LayoutTemplate,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { getPageKind, type UiDocument } from "../../core/document";
import { collectPageSubtreeIds } from "../../core/pages";
import { useEditorStore } from "../../editor-store";
import {
  buildNavigationTree,
  type NavigationTreeNode,
} from "../../navigation/navigation";
import { Badge, Callout, ConfirmDialog, IconButton, SidebarSection,
  Box,
  Icon,
  Pressable,
} from "../ui";

export function PageTree() {
  const document = useEditorStore((state) => state.document);
  const activePageId = useEditorStore((state) => state.activePageId);
  const setActivePageId = useEditorStore((state) => state.setActivePageId);
  const setStartPage = useEditorStore((state) => state.setStartPage);
  const addPage = useEditorStore((state) => state.addPage);
  const addPageLayout = useEditorStore((state) => state.addPageLayout);
  const deletePage = useEditorStore((state) => state.deletePage);
  const activeModalId = useEditorStore((state) => state.activeModalId);
  const setActiveModalId = useEditorStore((state) => state.setActiveModalId);
  const addModal = useEditorStore((state) => state.addModal);
  const deleteModal = useEditorStore((state) => state.deleteModal);
  const [pendingDeletePageId, setPendingDeletePageId] = useState<string | null>(null);

  const tree = useMemo(() => buildNavigationTree(document), [document]);
  const layouts = useMemo(
    () =>
      Object.values(document.pages).filter(
        (page) => getPageKind(page) === "layout"
      ),
    [document]
  );
  const runtimePageCount = Object.values(document.pages).filter(
    (page) => getPageKind(page) === "page"
  ).length;
  const pendingDeletePage = pendingDeletePageId
    ? document.pages[pendingDeletePageId]
    : undefined;
  const pendingKind = pendingDeletePage ? getPageKind(pendingDeletePage) : "page";
  const pendingDeletePageIds = pendingDeletePage
    ? collectPageSubtreeIds(document, pendingDeletePage.id)
    : [];
  const pendingDescendantCount = Math.max(0, pendingDeletePageIds.length - 1);
  const canConfirmDelete =
    !!pendingDeletePage &&
    (pendingKind === "layout" || pendingDeletePageIds.length < runtimePageCount);

  return (
    <Box data-editor-ignore className="space-y-4">
      <SidebarSection
        title="Pages"
        actions={
          <IconButton aria-label="Add top-level page" variant="secondary" onClick={() => addPage()}>
            <Icon glyph={Plus} size={14} />
          </IconButton>
        }
      >
        <Box className="space-y-0.5">
          {tree.map((node) => (
            <PageTreeRow
              key={node.pageId}
              node={node}
              depth={0}
              activePageId={activeModalId ? "" : activePageId}
              startPageId={document.startPageId}
              runtimePageCount={runtimePageCount}
              onOpen={setActivePageId}
              onSetStartPage={setStartPage}
              onAddChild={(pageId) => addPage(pageId)}
              onDelete={setPendingDeletePageId}
              document={document}
            />
          ))}
        </Box>
      </SidebarSection>

      <SidebarSection
        title="Layouts"
        className="border-t border-[var(--editor-border)] pt-3"
        actions={
          <IconButton aria-label="Add page layout" variant="secondary" onClick={() => addPageLayout()}>
            <Icon glyph={Plus} size={14} />
          </IconButton>
        }
      >
        <Box className="space-y-0.5">
          {layouts.length > 0 ? (
            layouts.map((layout) => (
              <LayoutRow
                key={layout.id}
                name={layout.name}
                active={!activeModalId && layout.id === activePageId}
                onOpen={() => setActivePageId(layout.id)}
                onDelete={() => setPendingDeletePageId(layout.id)}
              />
            ))
          ) : (
            <Callout dashed size="sm">
              Add a layout to share navigation, headers, sidebars and other chrome between pages.
            </Callout>
          )}
        </Box>
      </SidebarSection>

      <SidebarSection
        title="Modals"
        className="border-t border-[var(--editor-border)] pt-3"
        actions={
          <IconButton aria-label="Add modal" variant="secondary" onClick={() => addModal()}>
            <Icon glyph={Plus} size={14} />
          </IconButton>
        }
      >
        <Box className="space-y-0.5">
          {Object.values(document.modals ?? {}).length > 0 ? (
            Object.values(document.modals ?? {}).map((modal) => (
              <ModalRow
                key={modal.id}
                name={modal.name}
                active={modal.id === activeModalId}
                onOpen={() => setActiveModalId(modal.id)}
                onDelete={() => deleteModal(modal.id)}
              />
            ))
          ) : (
            <Callout dashed size="sm">
              Add a reusable modal surface with its own lifecycle events and script API.
            </Callout>
          )}
        </Box>
      </SidebarSection>

      <ConfirmDialog
        open={!!pendingDeletePage}
        title={`Delete ${pendingDeletePage?.name ?? (pendingKind === "layout" ? "layout" : "page")}?`}
        description={
          pendingKind === "layout"
            ? "This will remove the layout and its UI nodes. Pages using it will return to no layout."
            : pendingDescendantCount > 0
              ? `This will permanently remove this page, ${pendingDescendantCount} nested subpage${pendingDescendantCount === 1 ? "" : "s"}, and all of their UI nodes.`
              : "This will permanently remove this page and all of its UI nodes."
        }
        confirmLabel={pendingKind === "layout" ? "Delete layout" : "Delete page"}
        destructive
        onCancel={() => setPendingDeletePageId(null)}
        onConfirm={() => {
          if (pendingDeletePage && canConfirmDelete) {
            deletePage(pendingDeletePage.id);
          }
          setPendingDeletePageId(null);
        }}
      />
    </Box>
  );
}

function LayoutRow({
  name,
  active,
  onOpen,
  onDelete,
}: {
  name: string;
  active: boolean;
  onOpen(): void;
  onDelete(): void;
}) {
  return (
    <Box
      className={`group flex h-8 items-center rounded-md px-1 text-xs transition ${
        active
          ? "bg-violet-50 text-violet-700"
          : "text-[var(--editor-text)] hover:bg-[var(--editor-surface)]"
      }`}
    >
      <Pressable
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-2 px-1.5 py-1 text-left"
      >
        <Icon glyph={LayoutTemplate} size={12} className="shrink-0 opacity-70" />
        <span className="truncate font-medium">{name}</span>
      </Pressable>
      <Box className="hidden shrink-0 group-hover:block">
        <IconButton
          aria-label={`Delete ${name}`}
          title={`Delete ${name}`}
          variant="danger"
          size="icon-xs"
          onClick={onDelete}
        >
          <Icon glyph={Trash2} size={12} />
        </IconButton>
      </Box>
    </Box>
  );
}

function ModalRow({
  name,
  active,
  onOpen,
  onDelete,
}: {
  name: string;
  active: boolean;
  onOpen(): void;
  onDelete(): void;
}) {
  return (
    <Box
      className={`group flex h-8 items-center rounded-md px-1 text-xs transition ${
        active
          ? "bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]"
          : "text-[var(--editor-text)] hover:bg-[var(--editor-surface)]"
      }`}
    >
      <Pressable
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-2 px-1.5 py-1 text-left"
      >
        <Icon glyph={FileText} size={12} className="shrink-0 opacity-70" />
        <span className="truncate font-medium">{name}</span>
        <Badge className="ml-auto group-hover:hidden">modal</Badge>
      </Pressable>
      <Box className="hidden shrink-0 group-hover:block">
        <IconButton
          aria-label={`Delete ${name}`}
          title={`Delete ${name}`}
          variant="danger"
          size="icon-xs"
          onClick={onDelete}
        >
          <Icon glyph={Trash2} size={12} />
        </IconButton>
      </Box>
    </Box>
  );
}

function PageTreeRow({
  node,
  depth,
  activePageId,
  startPageId,
  runtimePageCount,
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
  runtimePageCount: number;
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
  const canDelete = deleteCount > 0 && deleteCount < runtimePageCount;

  return (
    <Box>
      <Box
        className={`group flex h-8 items-center rounded-md pr-1 text-xs transition ${
          active
            ? "bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]"
            : "text-[var(--editor-text)] hover:bg-[var(--editor-surface)]"
        }`}
        style={{ paddingLeft: 4 + depth * 14 }}
      >
        <Pressable
          type="button"
          aria-label={expanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
          onClick={() => setExpanded((value) => !value)}
          className={`inline-flex h-6 w-5 items-center justify-center text-[var(--editor-text-soft)] ${
            hasChildren ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          tabIndex={hasChildren ? 0 : -1}
        >
          <Icon glyph={ChevronRight}
            size={12}
            className={`transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </Pressable>

        <Pressable
          type="button"
          onClick={() => onOpen(node.pageId)}
          className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left"
        >
          {isStartPage ? (
            <Icon glyph={Home} size={12} className="shrink-0" />
          ) : (
            <Icon glyph={FileText} size={12} className="shrink-0 opacity-60" />
          )}
          <span className="truncate font-medium">{node.name}</span>
          {isStartPage ? (
            <span className="ml-auto rounded bg-[var(--editor-surface-muted)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--editor-text-muted)] group-hover:hidden">
              start
            </span>
          ) : null}
        </Pressable>

        <Box className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
          {!isStartPage ? (
            <IconButton
              aria-label={`Set ${node.name} as start page`}
              title={`Set ${node.name} as start page`}
              size="icon-xs"
              onClick={() => onSetStartPage(node.pageId)}
            >
              <Icon glyph={Home} size={12} />
            </IconButton>
          ) : null}
          <IconButton
            aria-label={`Add subpage under ${node.name}`}
            title={`Add subpage under ${node.name}`}
            size="icon-xs"
            onClick={() => onAddChild(node.pageId)}
          >
            <Icon glyph={Plus} size={12} />
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
            <Icon glyph={Trash2} size={12} />
          </IconButton>
        </Box>
      </Box>

      {expanded
        ? node.children.map((child) => (
            <PageTreeRow
              key={child.pageId}
              node={child}
              depth={depth + 1}
              activePageId={activePageId}
              startPageId={startPageId}
              runtimePageCount={runtimePageCount}
              onOpen={onOpen}
              onSetStartPage={onSetStartPage}
              onAddChild={onAddChild}
              onDelete={onDelete}
              document={document}
            />
          ))
        : null}
    </Box>
  );
}
