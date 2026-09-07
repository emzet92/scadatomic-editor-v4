import { useEditorStore } from "./editor-store";
import { sendWsMessage } from "./websocket";

export function Toolbar({ projectId }: { projectId?: string | undefined }) {
  const publish = () => {
    const document = useEditorStore.getState().document;

    if (!document.nodes[document.rootId]) {
      console.error("Cannot publish empty document");
      return;
    }

    sendWsMessage({
      type: "screen.publish",
      event: "screen.publish",
      projectId,
      document,
      // Legacy field for older runtimes/backends during migration.
      nodes: document.nodes,
    });
  };

  return (
    <header className="h-18 shrink-0 px-8 flex items-center justify-between bg-[var(--editor-surface)] border-b border-[var(--editor-border)]">
      <div className="flex items-center gap-4">
        <img src="/logo6.svg" alt="Scadatomic" className="h-10 w-auto shrink-0" />
      </div>

      <div className="flex items-center gap-2">
        <button
          data-editor-ignore
          onClick={publish}
          className="h-9 px-4 rounded-md bg-[var(--editor-accent)] text-white text-sm font-medium shadow-sm hover:bg-[var(--editor-accent-hover)] active:scale-[0.98] transition"
        >
          Publish
        </button>
      </div>
    </header>
  );
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
