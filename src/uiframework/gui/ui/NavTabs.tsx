import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

export function NavTabs({
  children,
  ariaLabel,
  className,
}: {
  children: ReactNode;
  ariaLabel: string;
  className?: string | undefined;
}) {
  return (
    <nav
      data-editor-ignore
      aria-label={ariaLabel}
      className={cx(
        "inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] p-1",
        className
      )}
    >
      {children}
    </nav>
  );
}

export type NavTabProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean | undefined;
  icon?: ReactNode | undefined;
};

export function NavTab({
  active = false,
  icon,
  children,
  className,
  type = "button",
  ...props
}: NavTabProps) {
  return (
    <button
      data-editor-ignore
      type={type}
      aria-current={active ? "page" : undefined}
      className={cx(
        "inline-flex h-7 items-center gap-2 rounded-md px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--editor-accent-soft)] disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "bg-[var(--editor-surface)] text-[var(--editor-accent)] shadow-sm ring-1 ring-[var(--editor-border)]"
          : "text-[var(--editor-text-muted)] hover:bg-[var(--editor-surface)] hover:text-[var(--editor-text)]",
        className
      )}
      {...props}
    >
      {icon ? <span className="shrink-0">{icon}</span> : null}
      {children}
    </button>
  );
}
