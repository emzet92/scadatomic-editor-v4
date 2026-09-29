import type { ReactNode } from "react";
import { Center, Inline, Stack } from "../atoms/Layout";
import { Surface } from "../atoms/Surface";
import { Text } from "../atoms/Typography";
import { cx } from "../utils/cx";

export type EmptyStateProps = {
  icon?: ReactNode | undefined;
  title: ReactNode;
  description?: ReactNode | undefined;
  actions?: ReactNode | undefined;
  compact?: boolean | undefined;
  className?: string | undefined;
};

export function EmptyState({ icon, title, description, actions, compact = false, className }: EmptyStateProps) {
  return (
    <Surface
      variant="muted"
      border="default"
      radius={compact ? "lg" : "xl"}
      padding={compact ? "md" : "lg"}
      className={cx("text-center", className)}
    >
      <Stack align="center" gap="none">
        {icon ? (
          <Center className="mb-3 size-11 rounded-2xl bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]">
            {icon}
          </Center>
        ) : null}
        <Text as="div" variant="body" className="font-semibold">{title}</Text>
        {description ? (
          <Text as="div" variant="body-sm" tone="muted" className="mt-1 max-w-md">
            {description}
          </Text>
        ) : null}
        {actions ? <Inline wrap justify="center" className="mt-4">{actions}</Inline> : null}
      </Stack>
    </Surface>
  );
}
