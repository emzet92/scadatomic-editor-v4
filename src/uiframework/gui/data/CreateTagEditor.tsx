import { Database, Plus } from "lucide-react";
import { useState } from "react";
import { createPrimitiveTag, createTagFromUdt, validateDataName } from "../../data/tags/TagRegistry";
import type { ProjectData } from "../../data/tags/TagDefinition";
import type { DataType, PrimitiveDataType } from "../../data/types/DataType";
import { TypeRegistry } from "../../data/types/TypeRegistry";
import { useEditorStore } from "../../editor-store";
import { Button, FormField, PanelCard, TextInput } from "../ui";
import { DataTypeSelect } from "./DataTypeSelect";
import { DataValueInput } from "./DataValueInput";
import type { DataSelection } from "./data-selection";

export function CreateTagEditor({ data, onSelect }: { data: ProjectData; onSelect(selection: DataSelection): void }) {
  const updateProjectData = useEditorStore((state) => state.updateProjectData);
  const [name, setName] = useState("Tag1");
  const [type, setType] = useState<DataType>({ kind: "bool" });
  const [value, setValue] = useState<unknown>(false);
  const [error, setError] = useState<string | null>(null);

  function changeType(next: DataType) {
    setType(next);
    setValue(next.kind === "udt" ? undefined : TypeRegistry.getDefaultValue(next));
  }

  function create() {
    const nameError = validateDataName(data, name, { kind: "tag" });
    if (nameError) { setError(nameError); return; }
    let createdId: string | undefined;
    try {
      updateProjectData((current) => {
        const next = type.kind === "udt" ? createTagFromUdt(current, name, type.udtId) : createPrimitiveTag(current, name, type, value);
        createdId = Object.keys(next.tags).find((id) => !current.tags[id]);
        return next;
      });
      if (createdId) onSelect({ kind: "tag", tagId: createdId });
    } catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
  }

  return <EditorFrame title="Create tag" subtitle="Create a primitive value or an independent UDT instance.">
    <PanelCard className="max-w-xl space-y-4">
      <FormField label="Name" error={error}><TextInput value={name} onChange={(event) => { setName(event.target.value); setError(null); }} mono /></FormField>
      <FormField label="Type"><DataTypeSelect data={data} value={type} onChange={changeType} /></FormField>
      {type.kind !== "udt" ? <FormField label="Default / current value"><DataValueInput type={type as PrimitiveDataType} value={value} onChange={setValue} /></FormField> : <div className="rounded-md bg-[var(--editor-surface-muted)] p-3 text-xs text-[var(--editor-text-muted)]">Fields will be initialized from the UDT defaults.</div>}
      <Button variant="primary" onClick={create}><Plus size={14} /> Create tag</Button>
    </PanelCard>
  </EditorFrame>;
}

function EditorFrame({ title, subtitle, children }: React.PropsWithChildren<{ title: string; subtitle: string }>) {
  return <div className="mx-auto max-w-5xl space-y-5 p-8"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]"><Database size={18} /></div><div><h1 className="text-lg font-semibold text-[var(--editor-text)]">{title}</h1><p className="text-sm text-[var(--editor-text-muted)]">{subtitle}</p></div></div>{children}</div>;
}
