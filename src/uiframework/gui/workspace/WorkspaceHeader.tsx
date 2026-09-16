import { Cloud, Code2, LayoutDashboard, Network, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { NavTab, NavTabs } from "../ui";
import { useNavigate } from "react-router-dom";

export type WorkspaceId = "editor" | "scripts" | "dependencies" | "cloud";

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
  {
    id: "dependencies",
    label: "Dependencies",
    icon: Network,
    href: ({ projectId }) =>
      projectId
        ? `/project/${encodeURIComponent(projectId)}/dependencies`
        : null,
  },
  {
    id: "cloud",
    label: "Cloud",
    icon: Cloud,
    href: () => "/cloud/fleet",
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
    <NavTabs ariaLabel="Project workspace">
      {DEFAULT_WORKSPACES.map((workspace) => {
        const Icon = workspace.icon;
        const isActive = workspace.id === active;
        const href = workspace.href(routeContext);
        const disabled = href === null;

        return (
          <NavTab
            key={workspace.id}
            active={isActive}
            disabled={disabled}
            icon={<Icon size={15} strokeWidth={1.8} />}
            onClick={() => {
              if (isActive || !href) {
                return;
              }

              onBeforeNavigate?.(workspace.id);
              navigate(href);
            }}
          >
            {workspace.label}
          </NavTab>
        );
      })}
    </NavTabs>
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
