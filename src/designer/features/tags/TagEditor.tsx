import { useState } from "react";
import { deleteTag, renameTag, validateDataName } from "../../../tags/model/TagRegistry";
import { isUdtTag, type ProjectData } from "../../../tags/model/TagDefinition";
import { useDesignerTagValue } from "../../../tags/model/designer-tag-store";
import { TypeRegistry } from "../../../tags/types/TypeRegistry";
import { useEditorStore } from "../../state/editor-store";
import {
  Button,
  ConfirmDialog,
  DatabaseIcon,
  DeleteIcon,
  EditorPage,
  FormField,
  Grid,
  Inline,
  PanelCard,
  SectionHeader,
  TextInput
} from "../../../shared/ui";
import { DataTypeSelect } from "./DataTypeSelect";
import { DataValueInput } from "./DataValueInput";
import type { DataSelection } from "./data-selection";
import type { PrimitiveDataType } from "../../../tags/types/DataType";
import type { TagFieldRef } from "../../../tags/model/TagFieldRef";
import { TagSourceEditor } from "./simulation/TagSourceEditor";
import { ReactiveTagEventsEditor } from "./ReactiveTagEventsEditor";
import { TagAlarmsEditor } from "../alarms/TagAlarmsEditor";

export function TagEditor({ data, tagId, onSelect, projectId, onOpenAlarm }: { data: ProjectData; tagId: string; onSelect(selection: DataSelection): void; projectId?: string | undefined; onOpenAlarm?: ((alarmId: string) => void) | undefined }) {
  const tag = data.tags[tagId];
  const updateProjectData = useEditorStore((state) => state.updateProjectData);
  const setTagValue = useEditorStore((state) => state.setTagValue);
  const [name, setName] = useState(tag?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  if (!tag) return <Missing />;
  const stableTag = tag;
  const udtTag = isUdtTag(stableTag) ? stableTag : undefined;
  const definition = udtTag ? data.udts[udtTag.type.udtId] : undefined;

  function saveName() {
    const nameError = validateDataName(data, name, { kind: "tag", ignoreId: stableTag.id });
    if (nameError) { setError(nameError); return; }
    try { updateProjectData((current) => renameTag(current, stableTag.id, name)); setError(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
  }

  return (
    <EditorPage
      title={stableTag.name}
      description={definition ? `${definition.name} instance` : `${TypeRegistry.getDisplayName(stableTag.type)} tag`}
      icon={<DatabaseIcon size="lg" />}
      actions={<Button variant="danger" leadingIcon={<DeleteIcon size="sm" />} onClick={() => setDeleteOpen(true)}>Delete</Button>}
    >
      <PanelCard>
        <Grid className="md:grid-cols-2" gap="lg">
          <FormField label="Name" error={error}>
            <Inline><TextInput value={name} onChange={(event) => setName(event.target.value)} mono /><Button onClick={saveName}>Rename</Button></Inline>
          </FormField>
          <FormField label="Type"><DataTypeSelect data={data} value={stableTag.type} onChange={() => undefined} disabled /></FormField>
        </Grid>
      </PanelCard>

      {isUdtTag(stableTag) && definition ? (
        <PanelCard className="space-y-4">
          <SectionHeader title="Values" description="Every edit is routed to the mapped driver; driver readback updates TagStore and emits tag.changed." />
          <Grid className="md:grid-cols-2">
            {definition.fields.map((field) => field.type.kind === "udt" ? null : (
              <TagFieldValue
                key={field.id}
                data={data}
                target={{ tagId: stableTag.id, fieldIds: [field.id] }}
                path={`${stableTag.name}.${field.name}`}
                label={field.name}
                type={field.type}
                projectId={projectId}
                onOpenAlarm={onOpenAlarm}
                onChange={(value) => {
                  const result = setTagValue(`${stableTag.name}.${field.name}`, value);
                  if (!result.ok) setError(result.error);
                }}
              />
            ))}
          </Grid>
        </PanelCard>
      ) : !isUdtTag(stableTag) ? (
        <PanelCard className="max-w-xl">
          <TagFieldValue
            data={data}
            target={{ tagId: stableTag.id, fieldIds: [] }}
            path={stableTag.name}
            label="Value"
            type={stableTag.type}
            projectId={projectId}
            onOpenAlarm={onOpenAlarm}
            onChange={(value) => {
              const result = setTagValue(stableTag.name, value);
              if (!result.ok) setError(result.error);
            }}
          />
        </PanelCard>
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        title={`Delete ${stableTag.name}?`}
        description="The tag and its persisted runtime value will be removed from this project."
        confirmLabel="Delete tag"
        destructive
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          updateProjectData((current) => deleteTag(current, stableTag.id));
          setDeleteOpen(false);
          onSelect(null);
        }}
      />
    </EditorPage>
  );
}

function TagFieldValue({ data, target, path, label, type, onChange, projectId, onOpenAlarm }: { data: ProjectData; target: TagFieldRef; path: string; label: string; type: PrimitiveDataType; onChange(value: string | number | boolean): void; projectId?: string | undefined; onOpenAlarm?: ((alarmId: string) => void) | undefined }) {
  const value = useDesignerTagValue(path);
  return (
    <PanelCard variant="muted" className="space-y-3">
      <FormField label={label} description={path}><DataValueInput type={type} value={value} onChange={onChange} /></FormField>
      <TagSourceEditor data={data} target={target} />
      <ReactiveTagEventsEditor target={target} path={path} projectId={projectId} />
      <TagAlarmsEditor projectId={projectId} path={path} type={type} {...(onOpenAlarm ? { onOpenAlarm } : {})} />
    </PanelCard>
  );
}

function Missing() {
  return <EditorPage title="Tag unavailable" description="Tag no longer exists." icon={<DatabaseIcon size="lg" />}><PanelCard variant="muted">Select another tag from the data tree.</PanelCard></EditorPage>;
}
