import { createAlarmDefinition, useAlarmDefinitions, useAlarmLibrary } from "../../../alarms";
import type { ProjectData } from "../../../tags/model/TagDefinition";
import { AddIcon, AlertTriangleIcon, Badge, Button, SidebarSection, Stack, Text } from "../../../shared/ui";

export function AlarmPanel({ projectId, data, selectedAlarmId, onSelect }: {
  projectId?: string | undefined;
  data: ProjectData;
  selectedAlarmId: string | null;
  onSelect(alarmId: string): void;
}) {
  const library = useAlarmLibrary();
  const { items, loading, error } = useAlarmDefinitions(projectId);
  return (
    <SidebarSection title="Alarms" description="Project alarm definitions." className="space-y-3">
      <Button size="xs" leadingIcon={<AddIcon size="xs" />} disabled={!projectId || Object.keys(data.tags).length === 0} onClick={() => {
        if (!projectId) return;
        const tag = Object.values(data.tags)[0];
        if (!tag) return;
        const condition = tag.type.kind === "bool" ? ({ kind: "boolean", activeWhen: true } as const) : tag.type.kind === "int" ? ({ kind: "high", limit: 0 } as const) : ({ kind: "equals", value: "" } as const);
        void library.save(createAlarmDefinition({ projectId, source: { kind: "tag", path: tag.name }, condition, name: `${tag.name} alarm` })).then((saved) => onSelect(saved.id));
      }}>New alarm</Button>
      {loading ? <Text variant="body-sm" tone="muted">Loading…</Text> : error ? <Text variant="body-sm" tone="danger">{error}</Text> : (
        <Stack gap="xs">
          {items.map((alarm) => (
            <button key={alarm.id} type="button" className={`w-full rounded-lg border p-2.5 text-left ${selectedAlarmId === alarm.id ? "border-[var(--editor-accent)] bg-[var(--editor-accent-soft)]" : "border-[var(--editor-border)] bg-[var(--editor-surface)]"}`} onClick={() => onSelect(alarm.id)}>
              <div className="flex items-center gap-2"><AlertTriangleIcon size="xs" /><span className="min-w-0 flex-1 truncate text-xs font-medium">{alarm.name}</span><Badge>{alarm.priority}</Badge></div>
              <div className="mt-1 truncate font-mono text-[9px] text-[var(--editor-text-muted)]">{alarm.source.path}</div>
            </button>
          ))}
          {items.length === 0 ? <Text variant="body-sm" tone="muted">No alarms yet.</Text> : null}
        </Stack>
      )}
    </SidebarSection>
  );
}
