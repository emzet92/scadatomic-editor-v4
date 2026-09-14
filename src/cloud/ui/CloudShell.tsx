import {
  Box,
  ChevronRight,
  Cloud,
  FolderKanban,
  Gauge,
  LayoutDashboard,
  MonitorDot,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button, cx } from "../../uiframework/gui/ui";

type CloudShellProps = {
  projectName: string;
  children: ReactNode;
};

type SidebarItemProps = {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  nested?: boolean;
  onClick?: () => void;
};

export function CloudShell({ projectName, children }: CloudShellProps) {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen min-h-0 flex-col bg-[var(--editor-app-bg)] text-[var(--editor-text)]">
      <header className="flex h-16 shrink-0 items-center justify-between gap-6 border-b border-[var(--editor-border)] bg-[var(--editor-surface)] px-6">
        <div className="flex min-w-0 items-center gap-5">
          <img src="/logo6.svg" alt="Scadatomic" className="h-9 w-auto shrink-0" />

          <nav className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] p-1">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex h-7 items-center gap-2 rounded-md px-3 text-sm font-medium text-[var(--editor-text-muted)] transition hover:bg-[var(--editor-surface)] hover:text-[var(--editor-text)]"
            >
              <LayoutDashboard size={15} strokeWidth={1.8} />
              Designer
            </button>
            <button
              type="button"
              aria-current="page"
              className="inline-flex h-7 items-center gap-2 rounded-md bg-[var(--editor-surface)] px-3 text-sm font-medium text-[var(--editor-accent)] shadow-sm ring-1 ring-[var(--editor-border)]"
            >
              <Cloud size={15} strokeWidth={1.8} />
              Cloud
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right md:block">
            <div className="text-xs font-medium text-[var(--editor-text)]">Local development</div>
            <div className="text-[10px] text-[var(--editor-text-soft)]">IndexedDB adapter</div>
          </div>
          <div className="flex size-9 items-center justify-center rounded-full border border-[var(--editor-border)] bg-[var(--editor-accent-soft)] text-xs font-semibold text-[var(--editor-accent)]">
            SA
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-64 shrink-0 overflow-auto border-r border-[var(--editor-border)] bg-[var(--editor-surface-muted)] p-4">
          <div className="mb-6 px-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--editor-text-soft)]">
              Cloud projects
            </div>
          </div>

          <div className="space-y-1">
            <SidebarItem icon={FolderKanban} label={projectName} active />
            <div className="ml-4 border-l border-[var(--editor-border)] pl-3">
              <SidebarItem
                icon={MonitorDot}
                label="Fleet Management"
                active
                nested
              />
              <SidebarItem icon={Box} label="Deployments" disabled nested />
              <SidebarItem icon={Gauge} label="Telemetry" disabled nested />
            </div>
          </div>

          <div className="mt-8 border-t border-[var(--editor-border)] pt-4">
            <SidebarItem icon={Settings} label="Project settings" disabled />
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  active = false,
  disabled = false,
  nested = false,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition",
        nested && "text-xs",
        active
          ? "bg-[var(--editor-selected-soft)] font-medium text-[var(--editor-accent)]"
          : "text-[var(--editor-text-muted)] hover:bg-[var(--editor-surface)] hover:text-[var(--editor-text)]",
        disabled && "cursor-not-allowed opacity-45"
      )}
    >
      <Icon size={nested ? 14 : 16} strokeWidth={1.8} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {active && nested ? <ChevronRight size={13} /> : null}
    </button>
  );
}

export function CloudPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--editor-border)] bg-[var(--editor-surface)] px-8 py-7 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--editor-accent)]">
          {eyebrow}
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--editor-text)]">
          {title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--editor-text-muted)]">
          {description}
        </p>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function CloudHeaderButton({ children, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button size="md" {...props}>
      {children}
    </Button>
  );
}
