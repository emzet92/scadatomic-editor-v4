import { createAlarmDefinition, useAlarmDefinition, useAlarmDefinitions, useAlarmLibrary } from "../../../alarms";
import type { ProjectData } from "../../../tags/model/TagDefinition";
import { AlertTriangleIcon, Callout, EditorPage, Grid, MetricCard, PanelCard } from "../../../shared/ui";
import { AlarmDefinitionForm } from "./AlarmDefinitionForm";

export function AlarmWorkspace({ projectId, data, selectedAlarmId, onSelect }: {
  projectId?: string | undefined;
  data: ProjectData;
  selectedAlarmId: string | null;
  onSelect(alarmId: string | null): void;
}) {
  const library = useAlarmLibrary();
  const { items } = useAlarmDefinitions(projectId);
  const { definition } = useAlarmDefinition(selectedAlarmId);

  if (!projectId) return <EditorPage title="Alarms" description="Save the project before configuring alarms." icon={<AlertTriangleIcon size="lg" />}><PanelCard variant="muted">Alarm definitions are project-scoped.</PanelCard></EditorPage>;

  const stableProjectId = projectId;

  async function createFirst() {
    const firstTag = Object.values(data.tags)[0];
    const path = firstTag?.name ?? "Tag";
    const definition = createAlarmDefinition({ projectId: stableProjectId, source: { kind: "tag", path }, condition: { kind: "boolean", activeWhen: true }, name: `${path} alarm` });
    const saved = await library.save(definition);
    onSelect(saved.id);
  }

  return (
    <EditorPage title={definition?.name ?? "Alarms"} description="Alarm engineering: definitions, delays, deadband, operator guidance and deterministic testing." icon={<AlertTriangleIcon size="lg" />} size="lg">
      {!definition ? (
        <>
          <Grid className="md:grid-cols-3" gap="lg">
            <MetricCard value={items.length} label="Definitions" />
            <MetricCard value={items.filter((item) => item.priority === "critical" || item.priority === "high").length} label="High priority" />
            <MetricCard value={items.filter((item) => item.enabled).length} label="Enabled" />
          </Grid>
          <Callout><strong>Alarm rule:</strong> definitions belong to the alarm domain. Tag Inspector is only a convenient entry point; the runtime evaluates them independently of any screen.</Callout>
          <PanelCard variant="muted"><button className="text-sm font-medium text-[var(--editor-accent)]" onClick={() => void createFirst()}>Create an alarm</button></PanelCard>
        </>
      ) : <AlarmDefinitionForm definition={definition} onSaved={(saved) => onSelect(saved.id)} onDeleted={() => onSelect(null)} />}
    </EditorPage>
  );
}
