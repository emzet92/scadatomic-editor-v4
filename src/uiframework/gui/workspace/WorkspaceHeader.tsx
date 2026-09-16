import type { ReactNode } from "react";
import {
  CloudIcon,
  CodeIcon,
  DashboardIcon,
  FileTextIcon,
  Inline,
  NavTab,
  NavTabs,
  NetworkIcon,
  Stack,
  Text,
  Toolbar,
  type IconComponent
} from "../ui";
import { useNavigate } from "react-router-dom";

export type WorkspaceId = "editor" | "scripts" | "dependencies" | "reports" | "cloud";

type WorkspaceRouteContext = {
  projectId?: string | undefined;
  scriptId?: string | undefined;
};

type WorkspaceItem = {
  id: WorkspaceId;
  label: string;
  icon: IconComponent;
  href: (context: WorkspaceRouteContext) => string | null;
};

const DEFAULT_WORKSPACES: readonly WorkspaceItem[] = [
  { id: "editor", label: "Editor", icon: DashboardIcon, href: ({ projectId }) => projectId ? `/project/${encodeURIComponent(projectId)}` : "/" },
  { id: "scripts", label: "Scripts", icon: CodeIcon, href: ({ projectId, scriptId }) => projectId ? `/project/${encodeURIComponent(projectId)}/scripts/${encodeURIComponent(scriptId ?? "default")}` : null },
  { id: "dependencies", label: "Dependencies", icon: NetworkIcon, href: ({ projectId }) => projectId ? `/project/${encodeURIComponent(projectId)}/dependencies` : null },
  { id: "reports", label: "Reports", icon: FileTextIcon, href: ({ projectId }) => projectId ? `/project/${encodeURIComponent(projectId)}/reports` : null },
  { id: "cloud", label: "Cloud", icon: CloudIcon, href: () => "/cloud/fleet" },
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
        const WorkspaceIcon = workspace.icon;
        const isActive = workspace.id === active;
        const href = workspace.href(routeContext);
        const disabled = href === null;

        return (
          <NavTab
            key={workspace.id}
            active={isActive}
            disabled={disabled}
            icon={<WorkspaceIcon size={15} strokeWidth={1.8} />}
            onClick={() => {
              if (isActive || !href) return;
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
    <header className="shrink-0">
      <Toolbar
        start={
          <Inline gap="xl" className="min-w-0">
            <img src="/logo6.svg" alt="Scadatomic" className="h-9 w-auto shrink-0" />
            <WorkspaceNav active={active} projectId={projectId} scriptId={scriptId} onBeforeNavigate={onBeforeNavigate} />
            {title ? (
              <Stack gap="none" className="hidden min-w-0 border-l border-[var(--editor-border)] pl-5 xl:flex">
                <Text as="div" variant="body" truncate className="font-semibold">{title}</Text>
                {subtitle ? <Text as="div" variant="body-sm" tone="muted" truncate>{subtitle}</Text> : null}
              </Stack>
            ) : null}
          </Inline>
        }
        end={actions}
      />
    </header>
  );
}
