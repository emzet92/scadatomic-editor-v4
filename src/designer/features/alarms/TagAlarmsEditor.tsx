import { useMemo } from "react";
import { createAlarmDefinition, useAlarmDefinitions, useAlarmLibrary } from "../../../alarms";
import type { PrimitiveDataType } from "../../../tags/types/DataType";
import { AddIcon, Badge, Button, Inline, PanelCard, SectionHeader, Stack, Text } from "../../../shared/ui";

export function TagAlarmsEditor({ projectId, path, type, onOpenAlarm }: {
  projectId?: string | undefined;
  path: string;
  type: PrimitiveDataType;
  onOpenAlarm?: (alarmId: string) => void;
}) {
  const library = useAlarmLibrary();
  const { items } = useAlarmDefinitions(projectId);
  const alarms = useMemo(() => items.filter((item) => item.source.kind === "tag" && item.source.path === path), [items, path]);

  if (!projectId) return null;
  const stableProjectId = projectId;

  async function addAlarm() {
    const condition = type.kind === "bool"
      ? ({ kind: "boolean", activeWhen: true } as const)
      : type.kind === "int"
        ? ({ kind: "high", limit: 0 } as const)
        : ({ kind: "equals", value: "" } as const);
    const created = createAlarmDefinition({ projectId: stableProjectId, source: { kind: "tag", path }, condition, name: `${path} alarm` });
    const saved = await library.save(created);
    onOpenAlarm?.(saved.id);
  }

  return (
    <PanelCard variant="muted" className="space-y-3">
      <SectionHeader title="Alarms" description="Alarm definitions are independent of this editor and continue to evaluate in runtime." />
      {alarms.length === 0 ? <Text variant="body-sm" tone="muted">No alarms configured for this tag.</Text> : (
        <Stack gap="sm">
          {alarms.map((alarm) => (
            <button key={alarm.id} type="button" className="w-full rounded-lg border border-[var(--editor-border)] bg-[var(--editor-surface)] p-3 text-left hover:border-[var(--editor-accent-border)]" onClick={() => onOpenAlarm?.(alarm.id)}>
              <Inline className="justify-between">
                <span className="text-xs font-medium text-[var(--editor-text)]">{alarm.name}</span>
                <Badge variant={alarm.priority === "critical" || alarm.priority === "high" ? "danger" : alarm.priority === "medium" ? "warning" : "neutral"}>{alarm.priority}</Badge>
              </Inline>
              <div className="mt-1 font-mono text-[10px] text-[var(--editor-text-muted)]">{alarm.source.path} · {alarm.condition.kind}</div>
            </button>
          ))}
        </Stack>
      )}
      <Button size="xs" leadingIcon={<AddIcon size="xs" />} onClick={() => void addAlarm()}>Add alarm</Button>
    </PanelCard>
  );
}
