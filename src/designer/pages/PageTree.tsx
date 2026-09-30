import { useMemo, useState } from "react";
import { getPageKind, type UiDocument } from "../../project/model/document";
import { collectPageSubtreeIds } from "../../project/model/pages";
import { countTableDefinitionUsages, createTableDefinition, listTableDefinitions } from "../../visualization/tables/table-definition";
import { useEditorStore } from "../state/editor-store";
import {
  buildNavigationTree,
  type NavigationTreeNode,
} from "../../runtime/navigation/navigation";
import {
  AddIcon,
  Badge,
  Box,
  Callout,
  ChevronRightIcon,
  ConfirmDialog,
  DeleteIcon,
  FileTextIcon,
  GridIcon,
  HomeIcon,
  IconButton,
  Pressable,
  SidebarSection,
  TemplateIcon
} from "../../shared/ui";

export function PageTree({ onEditTable }: { onEditTable?: (tableId: string) => void } = {}) {
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
  const upsertComponentDefinition = useEditorStore((state) => state.upsertComponentDefinition);
  const removeComponentDefinition = useEditorStore((state) => state.removeComponentDefinition);
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
  const tables = useMemo(() => listTableDefinitions(document), [document]);

  function addTable() {
    const names = new Set(tables.map((table) => table.name));
    let index = 1;
    while (names.has(`Table${index}`)) index += 1;
    const table = createTableDefinition(`Table${index}`);
    upsertComponentDefinition(table);
    onEditTable?.(table.id);
  }
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
            <AddIcon size={14} />
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
            <AddIcon size={14} />
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
            <AddIcon size={14} />
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

      <SidebarSection
        title="Tables"
        className="border-t border-[var(--editor-border)] pt-3"
        actions={
          <IconButton aria-label="Add table" variant="secondary" onClick={addTable}>
            <AddIcon size={14} />
          </IconButton>
        }
      >
        <Box className="space-y-0.5">
          {tables.length > 0 ? (
            tables.map((table) => (
              <TableRow
                key={table.id}
                name={table.name}
                usageCount={countTableDefinitionUsages(document, table.id)}
                onOpen={() => onEditTable?.(table.id)}
                onDelete={() => removeComponentDefinition(table.id)}
              />
            ))
          ) : (
            <Callout dashed size="sm">
              Add a static table, then drop Text, Button or any other component into its cells.
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
        <TemplateIcon size={12} className="shrink-0 opacity-70" />
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
          <DeleteIcon size={12} />
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
        <FileTextIcon size={12} className="shrink-0 opacity-70" />
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
          <DeleteIcon size={12} />
        </IconButton>
      </Box>
    </Box>
  );
}

function TableRow({
  name,
  usageCount,
  onOpen,
  onDelete,
}: {
  name: string;
  usageCount: number;
  onOpen(): void;
  onDelete(): void;
}) {
  const inUse = usageCount > 0;
  return (
    <Box className="group flex h-8 items-center rounded-md px-1 text-xs text-[var(--editor-text)] transition hover:bg-[var(--editor-surface)]">
      <Pressable
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-2 px-1.5 py-1 text-left"
      >
        <GridIcon size={12} className="shrink-0 text-sky-600" />
        <span className="truncate font-medium">{name}</span>
        <Badge className="ml-auto group-hover:hidden">{inUse ? `${usageCount} use${usageCount === 1 ? "" : "s"}` : "table"}</Badge>
      </Pressable>
      <Box className="hidden shrink-0 group-hover:block">
        <IconButton
          aria-label={`Delete ${name}`}
          title={inUse ? "Remove table instances before deleting the definition" : `Delete ${name}`}
          variant="danger"
          size="icon-xs"
          disabled={inUse}
          onClick={onDelete}
        >
          <DeleteIcon size={12} />
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
          <ChevronRightIcon size={12}
            className={`transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </Pressable>

        <Pressable
          type="button"
          onClick={() => onOpen(node.pageId)}
          className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left"
        >
          {isStartPage ? (
            <HomeIcon size={12} className="shrink-0" />
          ) : (
            <FileTextIcon size={12} className="shrink-0 opacity-60" />
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
              <HomeIcon size={12} />
            </IconButton>
          ) : null}
          <IconButton
            aria-label={`Add subpage under ${node.name}`}
            title={`Add subpage under ${node.name}`}
            size="icon-xs"
            onClick={() => onAddChild(node.pageId)}
          >
            <AddIcon size={12} />
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
            <DeleteIcon size={12} />
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
