import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

export function SidebarSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: ReactNode | undefined;
  description?: ReactNode | undefined;
  actions?: ReactNode | undefined;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <section className={cx("space-y-3", className)}>
      {title || description || actions ? (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? (
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">
                {title}
              </div>
            ) : null}
            {description ? (
              <div className="mt-1 text-[10px] leading-4 text-[var(--editor-text-soft)]">
                {description}
              </div>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export type SidebarNavItemProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title"> & {
  icon?: ReactNode | undefined;
  title: ReactNode;
  description?: ReactNode | undefined;
  meta?: ReactNode | undefined;
  active?: boolean | undefined;
  variant?: "card" | "row" | undefined;
};

export function SidebarNavItem({
  icon,
  title,
  description,
  meta,
  active = false,
  variant = "card",
  className,
  type = "button",
  ...props
}: SidebarNavItemProps) {
  return (
    <button
      data-editor-ignore
      type={type}
      aria-pressed={active}
      className={cx(
        "w-full text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--editor-accent-soft)]",
        variant === "card" ? "rounded-xl border p-3" : "rounded-md border border-transparent px-2 py-2",
        active
          ? variant === "card"
            ? "border-[var(--editor-accent-border)] bg-[var(--editor-accent-soft)]"
            : "bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]"
          : variant === "card"
            ? "border-[var(--editor-border)] bg-[var(--editor-surface)] hover:bg-[var(--editor-surface-muted)]"
            : "text-[var(--editor-text)] hover:bg-[var(--editor-surface)]",
        className
      )}
      {...props}
    >
      <div className={cx("flex items-center gap-2 font-medium", variant === "card" ? "text-sm" : "text-xs", active ? "text-[var(--editor-accent)]" : "text-[var(--editor-text)]")}>
        {icon ? <span className="shrink-0">{icon}</span> : null}
        <span className="min-w-0 flex-1 truncate">{title}</span>
        {meta ? <span className="shrink-0 text-xs font-normal text-[var(--editor-text-muted)]">{meta}</span> : null}
      </div>
      {description ? (
        <div className={cx("mt-1 text-[var(--editor-text-muted)]", variant === "card" ? "text-xs leading-5" : "text-[10px] leading-4")}>{description}</div>
      ) : null}
    </button>
  );
}
