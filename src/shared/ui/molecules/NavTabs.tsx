import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Pressable } from "../atoms/Pressable";
import { cx } from "../utils/cx";

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
  className,
  type = "button",
  children,
  ...props
}: NavTabProps) {
  return (
    <Pressable
      type={type}
      aria-current={active ? "page" : undefined}
      className={cx(
        "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition",
        active
          ? "bg-[var(--editor-surface)] text-[var(--editor-text)] shadow-sm"
          : "text-[var(--editor-text-muted)] hover:text-[var(--editor-text)]",
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </Pressable>
  );
}
