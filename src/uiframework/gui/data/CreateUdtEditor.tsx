import { Braces, Plus } from "lucide-react";
import { useState } from "react";
import { validateDataName } from "../../data/tags/TagRegistry";
import type { ProjectData } from "../../data/tags/TagDefinition";
import { createUdtDefinition } from "../../data/udt/UdtRegistry";
import { useEditorStore } from "../../editor-store";
import { Button, FormField, PanelCard, TextInput } from "../ui";
import type { DataSelection } from "./data-selection";

export function CreateUdtEditor({ data, onSelect }: { data: ProjectData; onSelect(selection: DataSelection): void }) {
  const updateProjectData = useEditorStore((state) => state.updateProjectData);
  const [name, setName] = useState("Pump");
  const [error, setError] = useState<string | null>(null);
  return <div className="mx-auto max-w-5xl space-y-5 p-8"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]"><Braces size={18} /></div><div><h1 className="text-lg font-semibold">Create UDT</h1><p className="text-sm text-[var(--editor-text-muted)]">Define a reusable project-local data structure.</p></div></div><PanelCard className="max-w-xl space-y-4"><FormField label="Name" error={error}><TextInput value={name} onChange={(event) => { setName(event.target.value); setError(null); }} mono /></FormField><Button variant="primary" onClick={() => { const nameError = validateDataName(data, name, { kind: "udt" }); if (nameError) { setError(nameError); return; } const udt = createUdtDefinition(name.trim()); updateProjectData((current) => ({ ...current, udts: { ...current.udts, [udt.id]: udt } })); onSelect({ kind: "udt", udtId: udt.id }); }}><Plus size={14} /> Create UDT</Button></PanelCard></div>;
}
