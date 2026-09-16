import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Box, Inline, Stack } from "../atoms/Layout";
import { Pressable } from "../atoms/Pressable";
import { Text } from "../atoms/Typography";
import { cx } from "../utils/cx";

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
    <Pressable
      type={type}
      aria-pressed={selected}
      className={cx(
        "group rounded-2xl border p-3 text-left transition",
        selected
          ? "border-[var(--editor-accent-border)] bg-[var(--editor-accent-soft)] shadow-[0_0_0_1px_var(--editor-accent-border)]"
          : "border-[var(--editor-border)] bg-[var(--editor-surface)] hover:border-[var(--editor-border-strong)] hover:bg-[var(--editor-surface-muted)]",
        className
      )}
      {...props}
    >
      {preview}
      <Inline align="start" gap="md" className={cx("min-w-0", preview && "mt-2")}>
        {icon ? (
          <Box className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--editor-surface-muted)] text-[var(--editor-text-muted)]">
            {icon}
          </Box>
        ) : null}
        <Stack gap="none" className="min-w-0">
          <Text as="span" variant="label">{title}</Text>
          {description ? (
            <Text as="span" variant="metadata" tone="muted" className="mt-0.5">
              {description}
            </Text>
          ) : null}
        </Stack>
      </Inline>
    </Pressable>
  );
}
