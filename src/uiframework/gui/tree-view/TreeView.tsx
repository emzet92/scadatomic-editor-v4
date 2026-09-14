import { getPage } from "../../core/document";
import { buildDocumentIndex } from "../../core/document-index";
import { canAcceptManualChildren } from "../../repeat/RepeatBehavior";
import { useEditorStore } from "../../editor-store";
import { NodeTree } from "./NodeTree";

export function TreeView() {
  const document = useEditorStore((state) => state.document);
  const activePageId = useEditorStore((state) => state.activePageId);
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const selectedNodeIds = useEditorStore((state) => state.selectedNodeIds);
  const selectNode = useEditorStore((state) => state.selectNode);
  const moveNodeUp = useEditorStore((state) => state.moveNodeUp);
  const moveNodeDown = useEditorStore((state) => state.moveNodeDown);
  const duplicateNode = useEditorStore((state) => state.duplicateNode);
  const deleteNode = useEditorStore((state) => state.deleteNode);
  const page = getPage(document, activePageId);
  const index = buildDocumentIndex(document, page.rootId);

  if (!document.nodes[page.rootId]) return null;

  return (
    <div className="space-y-1">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs uppercase tracking-wide font-semibold text-[var(--editor-text-muted)]">
          Component tree
        </div>
        {selectedNodeIds.length > 1 ? (
          <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
            {selectedNodeIds.length} selected
          </span>
        ) : null}
      </div>

      <NodeTree
        rootId={page.rootId}
        nodes={document.nodes}
        selectedNodeId={selectedNodeId}
        selectedNodeIds={selectedNodeIds}
        selectNode={selectNode}
        moveNodeUp={moveNodeUp}
        moveNodeDown={moveNodeDown}
        duplicateNode={duplicateNode}
        canDuplicateNode={(nodeId) => {
          if (nodeId === page.rootId) return false;
          const parentId = index.parentById.get(nodeId);
          const parent = parentId ? document.nodes[parentId] : undefined;
          return !!parent && canAcceptManualChildren(parent);
        }}
        deleteNode={deleteNode}
        canDeleteNode={(nodeId) => nodeId !== page.rootId}
      />
    </div>
  );
}
