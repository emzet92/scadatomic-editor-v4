import type { ReactNode } from "react";
import { Stack } from "../atoms/Layout";
import { Text } from "../atoms/Typography";
import { PanelCard } from "./Panel";

export function MetricCard({
  icon,
  value,
  label,
  description,
}: {
  icon?: ReactNode | undefined;
  value: ReactNode;
  label: ReactNode;
  description?: ReactNode | undefined;
}) {
  return (
    <PanelCard>
      <Stack gap="none">
        {icon}
        <Text as="div" variant="body" className="mt-3 text-2xl font-semibold leading-none">{value}</Text>
        <Text as="div" variant="body-sm" tone="muted" className="mt-1">{label}</Text>
        {description ? <Text as="div" variant="body-sm" tone="muted" className="mt-2">{description}</Text> : null}
      </Stack>
    </PanelCard>
  );
}
