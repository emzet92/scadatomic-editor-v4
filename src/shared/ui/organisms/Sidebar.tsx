import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Inline, Stack } from "../atoms/Layout";
import { Pressable } from "../atoms/Pressable";
import { Text } from "../atoms/Typography";
import { SectionHeader } from "../molecules/SectionHeader";
import { cx } from "../utils/cx";

export type SidebarSectionProps = {
  title?: ReactNode | undefined;
  description?: ReactNode | undefined;
  actions?: ReactNode | undefined;
  children: ReactNode;
  className?: string | undefined;
};

export function SidebarSection({
  title,
  description,
  actions,
  children,
  className,
}: SidebarSectionProps) {
  return (
    <section className={cx("space-y-3", className)}>
      {title || description || actions ? (
        <SectionHeader title={title ?? ""} description={description} action={actions} />
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
    <Pressable
      type={type}
      aria-pressed={active}
      className={cx(
        "w-full text-left transition",
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
      <Stack gap="none">
        <Inline gap="sm" className={cx("font-medium", variant === "card" ? "text-sm" : "text-xs")}>
          {icon ? <span className="shrink-0">{icon}</span> : null}
          <Text as="span" variant={variant === "card" ? "body" : "body-sm"} tone={active ? "accent" : "default"} truncate className="min-w-0 flex-1 font-medium">
            {title}
          </Text>
          {meta ? <Text as="span" variant="body-sm" tone="muted" className="shrink-0 font-normal">{meta}</Text> : null}
        </Inline>
        {description ? (
          <Text as="div" variant={variant === "card" ? "body-sm" : "metadata"} tone="muted" className="mt-1">
            {description}
          </Text>
        ) : null}
      </Stack>
    </Pressable>
  );
}
