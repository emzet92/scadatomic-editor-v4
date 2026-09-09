import { Code2, LayoutDashboard, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

export type WorkspaceId = "editor" | "scripts";

type WorkspaceRouteContext = {
  projectId?: string | undefined;
  scriptId?: string | undefined;
};

type WorkspaceItem = {
  id: WorkspaceId;
  label: string;
  icon: LucideIcon;
  href: (context: WorkspaceRouteContext) => string | null;
};

const DEFAULT_WORKSPACES: readonly WorkspaceItem[] = [
  {
    id: "editor",
    label: "Editor",
    icon: LayoutDashboard,
    href: ({ projectId }) =>
      projectId ? `/project/${encodeURIComponent(projectId)}` : "/",
  },
  {
    id: "scripts",
    label: "Scripts",
    icon: Code2,
    href: ({ projectId, scriptId }) =>
      projectId
        ? `/project/${encodeURIComponent(projectId)}/scripts/${encodeURIComponent(scriptId ?? "default")}`
        : null,
  },
];

export function WorkspaceNav({
  active,
  projectId,
  scriptId,
  onBeforeNavigate,
}: {
  active: WorkspaceId;
  projectId?: string | undefined;
  scriptId?: string | undefined;
  onBeforeNavigate?: ((target: WorkspaceId) => void) | undefined;
}) {
  const navigate = useNavigate();
  const routeContext: WorkspaceRouteContext = { projectId, scriptId };

  return (
    <nav
      aria-label="Project workspace"
      className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] p-1"
    >
      {DEFAULT_WORKSPACES.map((workspace) => {
        const Icon = workspace.icon;
        const isActive = workspace.id === active;
        const href = workspace.href(routeContext);
        const disabled = href === null;

        return (
          <button
            key={workspace.id}
            type="button"
            aria-current={isActive ? "page" : undefined}
            disabled={disabled}
            onClick={() => {
              if (isActive || !href) {
                return;
              }

              onBeforeNavigate?.(workspace.id);
              navigate(href);
            }}
            className={`inline-flex h-7 items-center gap-2 rounded-md px-3 text-sm font-medium transition ${
              isActive
                ? "bg-[var(--editor-surface)] text-[var(--editor-accent)] shadow-sm ring-1 ring-[var(--editor-border)]"
                : "text-[var(--editor-text-muted)] hover:bg-[var(--editor-surface)] hover:text-[var(--editor-text)]"
            } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
          >
            <Icon size={15} strokeWidth={1.8} />
            {workspace.label}
          </button>
        );
      })}
    </nav>
  );
}

export function WorkspaceHeader({
  active,
  projectId,
  scriptId,
  title,
  subtitle,
  onBeforeNavigate,
  actions,
}: {
  active: WorkspaceId;
  projectId?: string | undefined;
  scriptId?: string | undefined;
  title?: string | undefined;
  subtitle?: string | undefined;
  onBeforeNavigate?: ((target: WorkspaceId) => void) | undefined;
  actions?: ReactNode;
}) {
  return (
    <header className="h-16 shrink-0 border-b border-[var(--editor-border)] bg-[var(--editor-surface)] px-6 flex items-center justify-between gap-6">
      <div className="min-w-0 flex items-center gap-5">
        <img
          src="/logo6.svg"
          alt="Scadatomic"
          className="h-9 w-auto shrink-0"
        />

        <WorkspaceNav
          active={active}
          projectId={projectId}
          scriptId={scriptId}
          onBeforeNavigate={onBeforeNavigate}
        />

        {title ? (
          <div className="min-w-0 hidden xl:block border-l border-[var(--editor-border)] pl-5">
            <div className="truncate text-sm font-semibold text-[var(--editor-text)]">
              {title}
            </div>
            {subtitle ? (
              <div className="truncate text-xs text-[var(--editor-text-muted)]">
                {subtitle}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
