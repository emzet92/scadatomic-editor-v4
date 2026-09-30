import { useEffect, useMemo, useState } from "react";
import {
  type AlarmCondition,
  type AlarmDefinition,
  type AlarmPriority,
  AlarmTestSession,
  useAlarmLibrary,
} from "../../../alarms";
import {
  Badge,
  Button,
  Checkbox,
  FormField,
  Grid,
  Inline,
  PanelCard,
  SectionHeader,
  Select,
  Stack,
  Text,
  TextInput,
} from "../../../shared/ui";

const priorities: AlarmPriority[] = ["critical", "high", "medium", "low"];

export function AlarmDefinitionForm({ definition, onSaved, onDeleted }: {
  definition: AlarmDefinition;
  onSaved?: (definition: AlarmDefinition) => void;
  onDeleted?: () => void;
}) {
  const library = useAlarmLibrary();
  const [draft, setDraft] = useState(() => structuredClone(definition));
  const [status, setStatus] = useState<string | null>(null);
  const tester = useMemo(() => new AlarmTestSession(draft), [draft.id]);
  const [testValue, setTestValue] = useState("0");
  const [testRevision, setTestRevision] = useState(0);

  useEffect(() => {
    setDraft(structuredClone(definition));
    tester.setDefinition(definition);
    setTestRevision((value) => value + 1);
  }, [definition, tester]);

  const testSnapshot = tester.snapshot();

  async function save() {
    const saved = await library.save(draft);
    setDraft(saved);
    setStatus("Saved");
    onSaved?.(saved);
    window.setTimeout(() => setStatus(null), 1200);
  }

  async function remove() {
    await library.delete(draft);
    onDeleted?.();
  }

  function patch(patch: Partial<AlarmDefinition>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function updateCondition(kind: AlarmCondition["kind"]) {
    const condition: AlarmCondition = kind === "boolean"
      ? { kind, activeWhen: true }
      : kind === "equals"
        ? { kind, value: "" }
        : kind === "outside-range"
          ? { kind, min: 0, max: 100 }
          : { kind, limit: 0 };
    patch({ condition });
  }

  function runTestValue() {
    const value = parseTestValue(testValue, draft.condition);
    tester.setDefinition(draft);
    tester.setValue(value);
    setTestRevision((value) => value + 1);
  }

  void testRevision;

  return (
    <Stack gap="lg">
      <PanelCard>
        <SectionHeader title="Alarm definition" description={`Source: ${draft.source.path}`} />
        <Grid className="mt-4 md:grid-cols-2" gap="lg">
          <FormField label="Name"><TextInput value={draft.name} onChange={(event) => patch({ name: event.target.value })} /></FormField>
          <FormField label="Priority">
            <Select value={draft.priority} onChange={(event) => patch({ priority: event.target.value as AlarmPriority })}>
              {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </Select>
          </FormField>
          <FormField label="Condition">
            <Select value={draft.condition.kind} onChange={(event) => updateCondition(event.target.value as AlarmCondition["kind"])}>
              <option value="boolean">Boolean</option>
              <option value="high">High</option>
              <option value="high-high">High High</option>
              <option value="low">Low</option>
              <option value="low-low">Low Low</option>
              <option value="equals">Equals</option>
              <option value="outside-range">Outside range</option>
            </Select>
          </FormField>
          <ConditionFields condition={draft.condition} onChange={(condition) => patch({ condition })} />
          <FormField label="Deadband"><TextInput type="number" min="0" value={draft.deadband} onChange={(event) => patch({ deadband: numeric(event.target.value) })} /></FormField>
          <FormField label="On delay (ms)"><TextInput type="number" min="0" value={draft.onDelayMs} onChange={(event) => patch({ onDelayMs: numeric(event.target.value) })} /></FormField>
          <FormField label="Off delay (ms)"><TextInput type="number" min="0" value={draft.offDelayMs} onChange={(event) => patch({ offDelayMs: numeric(event.target.value) })} /></FormField>
          <FormField label="Message"><TextInput value={draft.message} onChange={(event) => patch({ message: event.target.value })} /></FormField>
          <FormField label="Cause"><TextInput value={draft.cause ?? ""} onChange={(event) => patch({ cause: event.target.value || undefined })} /></FormField>
          <FormField label="Consequence"><TextInput value={draft.consequence ?? ""} onChange={(event) => patch({ consequence: event.target.value || undefined })} /></FormField>
          <FormField label="Operator response" className="md:col-span-2"><TextInput value={draft.operatorResponse ?? ""} onChange={(event) => patch({ operatorResponse: event.target.value || undefined })} /></FormField>
        </Grid>
        <Inline className="mt-4 flex-wrap" gap="lg">
          <label className="inline-flex items-center gap-2 text-xs"><Checkbox checked={draft.enabled} onChange={(event) => patch({ enabled: event.target.checked })} /> Enabled</label>
          <label className="inline-flex items-center gap-2 text-xs"><Checkbox checked={draft.ackRequired} onChange={(event) => patch({ ackRequired: event.target.checked })} /> ACK required</label>
          <label className="inline-flex items-center gap-2 text-xs"><Checkbox checked={draft.latching} onChange={(event) => patch({ latching: event.target.checked })} /> Latching</label>
          <label className="inline-flex items-center gap-2 text-xs"><Checkbox checked={Boolean(draft.suppression)} onChange={(event) => patch({ suppression: event.target.checked ? { source: { kind: "tag", path: "Machine.Stopped" }, condition: { kind: "boolean", activeWhen: true } } : undefined })} /> Suppression rule</label>
        </Inline>
        {draft.suppression ? (
          <Grid className="mt-4 md:grid-cols-2" gap="lg">
            <FormField label="Suppress when tag"><TextInput mono value={draft.suppression.source.path} onChange={(event) => patch({ suppression: { ...draft.suppression!, source: { kind: "tag", path: event.target.value } } })} /></FormField>
            <FormField label="Boolean value"><Select value={String(draft.suppression.condition.kind === "boolean" ? draft.suppression.condition.activeWhen : true)} onChange={(event) => patch({ suppression: { source: draft.suppression!.source, condition: { kind: "boolean", activeWhen: event.target.value === "true" } } })}><option value="true">true</option><option value="false">false</option></Select></FormField>
          </Grid>
        ) : null}
        <Inline className="mt-5" gap="sm">
          <Button variant="primary" onClick={() => void save()}>Save alarm</Button>
          <Button variant="danger" onClick={() => void remove()}>Delete</Button>
          {status ? <Text variant="body-sm" tone="muted">{status}</Text> : null}
        </Inline>
      </PanelCard>

      <PanelCard variant="muted">
        <SectionHeader title="Isolated alarm tester" description="Virtual value and virtual time. Does not write to the project runtime or tag simulator." />
        <Grid className="mt-4 md:grid-cols-2" gap="lg">
          <FormField label="Test value">
            <Inline><TextInput value={testValue} onChange={(event) => setTestValue(event.target.value)} /><Button onClick={runTestValue}>Apply</Button></Inline>
          </FormField>
          <FormField label="Virtual time">
            <Inline className="flex-wrap"><Button onClick={() => { tester.advanceBy(100); setTestRevision((v) => v + 1); }}>+100 ms</Button><Button onClick={() => { tester.advanceBy(1000); setTestRevision((v) => v + 1); }}>+1 s</Button><Button onClick={() => { tester.advanceBy(5000); setTestRevision((v) => v + 1); }}>+5 s</Button></Inline>
          </FormField>
        </Grid>
        <Inline className="mt-4 flex-wrap">
          <Badge variant={testSnapshot.instance.active ? "danger" : "success"}>{testSnapshot.instance.active ? "ACTIVE" : "NORMAL"}</Badge>
          <Badge variant={testSnapshot.instance.acknowledged ? "success" : "warning"}>{testSnapshot.instance.acknowledged ? "ACK" : "UNACK"}</Badge>
          <Text variant="body-sm" tone="muted">t={testSnapshot.now} ms</Text>
          <Button size="xs" onClick={() => { tester.acknowledge(); setTestRevision((v) => v + 1); }}>ACK</Button>
          <Button size="xs" onClick={() => { tester.reset(); setTestRevision((v) => v + 1); }}>Reset</Button>
        </Inline>
        <div className="mt-4 max-h-40 overflow-auto rounded-lg border border-[var(--editor-border)] bg-[var(--editor-surface)] p-3 font-mono text-[11px] text-[var(--editor-text-muted)]">
          {testSnapshot.events.length === 0 ? "No events yet." : testSnapshot.events.map((event) => <div key={event.id}>{event.timestamp}ms · {event.type}</div>)}
        </div>
      </PanelCard>
    </Stack>
  );
}

function ConditionFields({ condition, onChange }: { condition: AlarmCondition; onChange(condition: AlarmCondition): void }) {
  if (condition.kind === "boolean") {
    return <FormField label="Active when"><Select value={String(condition.activeWhen)} onChange={(event) => onChange({ ...condition, activeWhen: event.target.value === "true" })}><option value="true">true</option><option value="false">false</option></Select></FormField>;
  }
  if (condition.kind === "equals") {
    return <FormField label="Equals"><TextInput value={String(condition.value)} onChange={(event) => onChange({ ...condition, value: event.target.value })} /></FormField>;
  }
  if (condition.kind === "outside-range") {
    return <FormField label="Range"><Inline><TextInput type="number" value={condition.min} onChange={(event) => onChange({ ...condition, min: numeric(event.target.value) })} /><TextInput type="number" value={condition.max} onChange={(event) => onChange({ ...condition, max: numeric(event.target.value) })} /></Inline></FormField>;
  }
  return <FormField label="Limit"><TextInput type="number" value={condition.limit} onChange={(event) => onChange({ ...condition, limit: numeric(event.target.value) })} /></FormField>;
}

function numeric(value: string) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
function parseTestValue(value: string, condition: AlarmCondition): unknown {
  if (condition.kind === "boolean") return value.trim().toLowerCase() === "true" || value.trim() === "1";
  if (condition.kind === "equals" && typeof condition.value === "string") return value;
  return numeric(value);
}
