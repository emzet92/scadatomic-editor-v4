import type { ReactNode } from "react";
import { cx } from "./cx";

export type PageContainerSize = "md" | "lg" | "xl" | "full";

const sizeClassNames: Record<PageContainerSize, string> = {
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none",
};

export function PageContainer({
  children,
  size = "lg",
  className,
}: {
  children: ReactNode;
  size?: PageContainerSize | undefined;
  className?: string | undefined;
}) {
  return (
    <div className={cx("mx-auto w-full p-8", sizeClassNames[size], className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow = "Design System",
  icon,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode | undefined;
  icon?: ReactNode | undefined;
  title: ReactNode;
  description?: ReactNode | undefined;
  actions?: ReactNode | undefined;
  className?: string | undefined;
}) {
  return (
    <div className={cx("mb-7 flex items-start justify-between gap-5", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--editor-accent)]">
            {icon}
            {eyebrow}
          </div>
        ) : null}
        <h1 className={cx("text-2xl font-semibold text-[var(--editor-text)]", eyebrow && "mt-2")}>
          {title}
        </h1>
        {description ? (
          <div className="mt-1 max-w-2xl text-sm leading-6 text-[var(--editor-text-muted)]">
            {description}
          </div>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
