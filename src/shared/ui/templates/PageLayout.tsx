import type { ReactNode } from "react";
import { Box, Inline, Stack } from "../atoms/Layout";
import { Heading, Text } from "../atoms/Typography";
import { cx } from "../utils/cx";

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
  return <Box className={cx("mx-auto w-full p-8", sizeClassNames[size], className)}>{children}</Box>;
}

export type PageHeaderProps = {
  eyebrow?: ReactNode | undefined;
  icon?: ReactNode | undefined;
  title: ReactNode;
  description?: ReactNode | undefined;
  actions?: ReactNode | undefined;
  className?: string | undefined;
};

export function PageHeader({
  eyebrow = "Design System",
  icon,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <Inline align="start" justify="between" gap="lg" className={cx("mb-7", className)}>
      <Stack gap="none" className="min-w-0">
        {eyebrow ? (
          <Inline gap="sm" className="text-[var(--editor-accent)]">
            {icon}
            <Text as="span" variant="body-sm" tone="accent" className="font-semibold uppercase tracking-[0.14em]">
              {eyebrow}
            </Text>
          </Inline>
        ) : null}
        <Heading level={1} size="xl" className={cx(eyebrow && "mt-2")}>{title}</Heading>
        {description ? (
          <Text as="div" variant="body" tone="muted" className="mt-1 max-w-2xl">
            {description}
          </Text>
        ) : null}
      </Stack>
      {actions ? <Box className="shrink-0">{actions}</Box> : null}
    </Inline>
  );
}
