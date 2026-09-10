import { Database, Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteTag, renameTag, validateDataName } from "../../data/tags/TagRegistry";
import { isUdtTag, type ProjectData } from "../../data/tags/TagDefinition";
import { useDesignerTagValue } from "../../data/tags/designer-tag-store";
import { TypeRegistry } from "../../data/types/TypeRegistry";
import { useEditorStore } from "../../editor-store";
import { Button, ConfirmDialog, FormField, PanelCard, TextInput } from "../ui";
import { DataTypeSelect } from "./DataTypeSelect";
import { DataValueInput } from "./DataValueInput";
import type { DataSelection } from "./data-selection";

export function TagEditor({ data, tagId, onSelect }: { data: ProjectData; tagId: string; onSelect(selection: DataSelection): void }) {
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

  return <div className="mx-auto max-w-5xl space-y-5 p-8">
    <div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-lg font-semibold text-[var(--editor-text)]"><Database size={18} /> {stableTag.name}</div><p className="mt-1 text-sm text-[var(--editor-text-muted)]">{definition ? `${definition.name} instance` : `${TypeRegistry.getDisplayName(stableTag.type)} tag`}</p></div><Button variant="danger" onClick={() => setDeleteOpen(true)}><Trash2 size={13} /> Delete</Button></div>
    <PanelCard className="grid gap-4 md:grid-cols-2">
      <FormField label="Name" error={error}><div className="flex gap-2"><TextInput value={name} onChange={(event) => setName(event.target.value)} mono /><Button onClick={saveName}>Rename</Button></div></FormField>
      <FormField label="Type"><DataTypeSelect data={data} value={stableTag.type} onChange={() => undefined} disabled /></FormField>
    </PanelCard>
    {isUdtTag(stableTag) && definition ? <PanelCard className="space-y-4"><div><h2 className="text-sm font-semibold text-[var(--editor-text)]">Values</h2><p className="text-xs text-[var(--editor-text-muted)]">Every edit goes through TagStore.set() and emits tag.changed when the value actually changes.</p></div><div className="grid gap-3 md:grid-cols-2">{definition.fields.map((field) => field.type.kind === "udt" ? null : <TagFieldValue key={field.id} path={`${stableTag.name}.${field.name}`} label={field.name} type={field.type} onChange={(value) => { const result = setTagValue(`${stableTag.name}.${field.name}`, value); if (!result.ok) setError(result.error); }} />)}</div></PanelCard> : !isUdtTag(stableTag) ? <PanelCard className="max-w-xl"><TagFieldValue path={stableTag.name} label="Value" type={stableTag.type} onChange={(value) => { const result = setTagValue(stableTag.name, value); if (!result.ok) setError(result.error); }} /></PanelCard> : null}
    <ConfirmDialog open={deleteOpen} title={`Delete ${stableTag.name}?`} description="The tag and its persisted runtime value will be removed from this project." confirmLabel="Delete tag" destructive onCancel={() => setDeleteOpen(false)} onConfirm={() => { updateProjectData((current) => deleteTag(current, stableTag.id)); setDeleteOpen(false); onSelect(null); }} />
  </div>;
}

function TagFieldValue({ path, label, type, onChange }: { path: string; label: string; type: { kind: "string" } | { kind: "int" } | { kind: "bool" }; onChange(value: string | number | boolean): void }) {
  const value = useDesignerTagValue(path);
  return <FormField label={label} description={path}><DataValueInput type={type} value={value} onChange={onChange} /></FormField>;
}

function Missing() { return <div className="p-8 text-sm text-[var(--editor-text-muted)]">Tag no longer exists.</div>; }
