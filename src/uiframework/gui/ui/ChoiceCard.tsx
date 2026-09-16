import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

export type ChoiceCardProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title"> & {
  title: ReactNode;
  description?: ReactNode | undefined;
  icon?: ReactNode | undefined;
  preview?: ReactNode | undefined;
  selected?: boolean | undefined;
};

export function ChoiceCard({
  title,
  description,
  icon,
  preview,
  selected = false,
  className,
  type = "button",
  ...props
}: ChoiceCardProps) {
  return (
    <button
      data-editor-ignore
      type={type}
      aria-pressed={selected}
      className={cx(
        "group rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--editor-accent-soft)]",
        selected
          ? "border-[var(--editor-accent-border)] bg-[var(--editor-accent-soft)] shadow-[0_0_0_1px_var(--editor-accent-border)]"
          : "border-[var(--editor-border)] bg-[var(--editor-surface)] hover:border-[var(--editor-border-strong)] hover:bg-[var(--editor-surface-muted)]",
        className
      )}
      {...props}
    >
      {preview}
      <div className={cx("flex min-w-0 items-start gap-3", preview && "mt-2")}>
        {icon ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--editor-surface-muted)] text-[var(--editor-text-muted)]">
            {icon}
          </span>
        ) : null}
        <span className="min-w-0">
          <span className="block text-xs font-semibold text-[var(--editor-text)]">{title}</span>
          {description ? (
            <span className="mt-0.5 block text-[10px] leading-4 text-[var(--editor-text-muted)]">
              {description}
            </span>
          ) : null}
        </span>
      </div>
    </button>
  );
}
