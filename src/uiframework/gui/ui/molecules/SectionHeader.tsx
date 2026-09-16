import type { ReactNode } from "react";
import { Box, Inline, Stack } from "../atoms/Layout";
import { Text } from "../atoms/Typography";

export type SectionHeaderProps = {
  title: ReactNode;
  description?: ReactNode | undefined;
  action?: ReactNode | undefined;
  className?: string | undefined;
};

export function SectionHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <Inline align="start" justify="between" gap="md" className={className}>
      <Stack gap="none" className="min-w-0">
        <Text as="div" variant="eyebrow" tone="muted">
          {title}
        </Text>
        {description ? (
          <Text as="div" variant="metadata" tone="soft" className="mt-1">
            {description}
          </Text>
        ) : null}
      </Stack>
      {action ? <Box className="shrink-0">{action}</Box> : null}
    </Inline>
  );
}
