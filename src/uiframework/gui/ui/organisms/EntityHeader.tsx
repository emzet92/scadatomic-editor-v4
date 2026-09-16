import type { ReactNode } from "react";
import { Box, Inline, Stack } from "../atoms/Layout";
import { Heading, Text } from "../atoms/Typography";
import { IconTile } from "../molecules/IconTile";
import { cx } from "../utils/cx";

export type EntityHeaderProps = {
  title: ReactNode;
  description?: ReactNode | undefined;
  eyebrow?: ReactNode | undefined;
  icon?: ReactNode | undefined;
  actions?: ReactNode | undefined;
  className?: string | undefined;
  compact?: boolean | undefined;
};

export function EntityHeader({
  title,
  description,
  eyebrow,
  icon,
  actions,
  className,
  compact = false,
}: EntityHeaderProps) {
  return (
    <Inline align="start" justify="between" gap="lg" className={className}>
      <Inline align="start" gap="md" className="min-w-0">
        {icon ? <IconTile size={compact ? "md" : "lg"}>{icon}</IconTile> : null}
        <Stack gap="none" className="min-w-0">
          {eyebrow ? <Text as="div" variant="eyebrow" tone="muted">{eyebrow}</Text> : null}
          <Heading level={1} size={compact ? "md" : "lg"} className={cx(eyebrow && "mt-1")}>{title}</Heading>
          {description ? <Text as="p" variant="body" tone="muted" className="mt-1">{description}</Text> : null}
        </Stack>
      </Inline>
      {actions ? <Box className="shrink-0">{actions}</Box> : null}
    </Inline>
  );
}
