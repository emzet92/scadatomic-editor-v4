import type { UiDocument } from "./core/document";
import { WorkspaceHeader } from "./gui/workspace/WorkspaceHeader";
import { useEditorStore } from "./editor-store";
import { sendWsMessage } from "./websocket";

export function Toolbar({ projectId }: { projectId?: string | undefined }) {
  const document = useEditorStore((state) => state.document);
  const scriptId = getFirstScriptId(document);

  const publish = () => {
    if (!document.nodes[document.rootId]) {
      console.error("Cannot publish empty document");
      return;
    }

    sendWsMessage({
      type: "screen.publish",
      projectId,
      document,
    });
  };

  return (
    <WorkspaceHeader
      active="editor"
      projectId={projectId}
      scriptId={scriptId}
      title="Designer"
      subtitle="Visual UI editor"
      actions={
        <>
          {projectId ? (
            <a
              data-editor-ignore
              href={`/render/${encodeURIComponent(projectId)}`}
              target="_blank"
              rel="noreferrer"
              className="h-9 px-4 inline-flex items-center rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface)] text-[var(--editor-text)] text-sm font-medium hover:bg-[var(--editor-surface-muted)] transition"
            >
              Runtime preview
            </a>
          ) : null}

          <button
            data-editor-ignore
            onClick={publish}
            className="h-9 px-4 rounded-md bg-[var(--editor-accent)] text-white text-sm font-medium shadow-sm hover:bg-[var(--editor-accent-hover)] active:scale-[0.98] transition"
          >
            Publish
          </button>
        </>
      }
    />
  );
}

function getFirstScriptId(document: UiDocument) {
  for (const node of Object.values(document.nodes)) {
    const firstHandler = Object.values(node.events ?? {})[0];
    if (firstHandler) {
      return firstHandler.handlerId;
    }

    const firstMethod = Object.values(node.methods ?? {})[0];
    if (firstMethod) {
      return firstMethod.scriptId;
    }
  }

  return "default";
}

export function LeftSidebar({ children }: React.PropsWithChildren) {
  return (
    <aside className="w-80 shrink-0 bg-[var(--editor-surface-muted)] border-r border-[var(--editor-border)] overflow-auto">
      <div className="px-6 py-7 space-y-7">{children}</div>
    </aside>
  );
}

export function Canvas({ children }: React.PropsWithChildren) {
  return (
    <main className="flex-1 overflow-auto relative bg-[var(--editor-canvas-bg)]">
      {children}
    </main>
  );
}

export function RightSidebar({ children }: React.PropsWithChildren) {
  return (
    <aside className="w-80 shrink-0 bg-[var(--editor-surface-muted)] border-l border-[var(--editor-border)] overflow-auto">
      {children}
    </aside>
  );
}

export function StatusBar() {
  return (
    <div className="h-7 shrink-0 px-4 flex items-center border-t border-[var(--editor-border)] bg-[var(--editor-surface)] text-xs text-[var(--editor-text-muted)]">
      Ready
    </div>
  );
}
