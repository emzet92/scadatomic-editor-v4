import type { ReactNode } from "react";
import { Box } from "../atoms/Layout";
import { cx } from "../utils/cx";

export function WorkspaceShell({
  header,
  sidebar,
  inspector,
  children,
  className,
}: {
  header?: ReactNode | undefined;
  sidebar?: ReactNode | undefined;
  inspector?: ReactNode | undefined;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <Box className={cx("flex h-screen min-h-0 flex-col bg-[var(--editor-app-bg)] text-[var(--editor-text)]", className)}>
      {header}
      <Box className="flex min-h-0 flex-1">
        {sidebar ? <aside className="min-h-0 shrink-0 border-r border-[var(--editor-border)] bg-[var(--editor-surface)]">{sidebar}</aside> : null}
        <main className="min-h-0 min-w-0 flex-1 overflow-auto">{children}</main>
        {inspector ? <aside className="min-h-0 shrink-0 border-l border-[var(--editor-border)] bg-[var(--editor-surface)]">{inspector}</aside> : null}
      </Box>
    </Box>
  );
}
