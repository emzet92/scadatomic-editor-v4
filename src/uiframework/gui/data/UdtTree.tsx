import { Braces, ChevronRight, FunctionSquare, Plus } from "lucide-react";
import { useState } from "react";
import type { ProjectData } from "../../data/tags/TagDefinition";
import { TypeRegistry } from "../../data/types/TypeRegistry";
import { IconButton } from "../ui";
import type { DataSelection } from "./data-selection";

export function UdtTree({ data, selection, onSelect, onCreate }: { data: ProjectData; selection: DataSelection; onSelect(selection: DataSelection): void; onCreate(): void }) {
  const udts = Object.values(data.udts).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">UDTs</div>
        <IconButton aria-label="Create UDT" title="Create UDT" variant="secondary" onClick={onCreate}><Plus size={14} /></IconButton>
      </div>
      <div className="space-y-0.5">
        {udts.length === 0 ? <div className="rounded-md border border-dashed border-[var(--editor-border)] p-3 text-xs text-[var(--editor-text-soft)]">No UDT definitions yet.</div> : udts.map((udt) => <UdtRow key={udt.id} udt={udt} data={data} selection={selection} onSelect={onSelect} />)}
      </div>
    </div>
  );
}

function UdtRow({ udt, data, selection, onSelect }: { udt: ProjectData["udts"][string]; data: ProjectData; selection: DataSelection; onSelect(selection: DataSelection): void }) {
  const [expanded, setExpanded] = useState(true);
  const active = (selection?.kind === "udt" || selection?.kind === "udt-method") && selection.udtId === udt.id;
  return <div>
    <div className={`flex h-8 items-center rounded-md pr-2 text-xs ${active ? "bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]" : "text-[var(--editor-text)] hover:bg-[var(--editor-surface)]"}`}>
      <button type="button" onClick={() => setExpanded((value) => !value)} className="inline-flex h-6 w-6 items-center justify-center text-[var(--editor-text-soft)]"><ChevronRight size={12} className={expanded ? "rotate-90" : ""} /></button>
      <button type="button" onClick={() => onSelect({ kind: "udt", udtId: udt.id })} className="flex min-w-0 flex-1 items-center gap-2 text-left"><Braces size={13} /><span className="truncate font-medium">{udt.name}</span></button>
    </div>
    {expanded ? <div className="ml-8 space-y-0.5 border-l border-[var(--editor-border)] pl-3 py-1">
      {udt.fields.map((field) => <button key={field.id} type="button" onClick={() => onSelect({ kind: "udt", udtId: udt.id })} className="flex h-7 w-full items-center justify-between gap-2 text-left text-[11px] text-[var(--editor-text-muted)] hover:text-[var(--editor-text)]"><span>{field.name}</span><span className="text-[10px] text-[var(--editor-text-soft)]">{TypeRegistry.getDisplayName(field.type, field.type.kind === "udt" ? data.udts[field.type.udtId]?.name : undefined)}</span></button>)}
      {udt.methods.map((method) => <button key={method.id} type="button" onClick={() => onSelect({ kind: "udt-method", udtId: udt.id, methodId: method.id })} className={`flex h-7 w-full items-center gap-2 text-left text-[11px] ${selection?.kind === "udt-method" && selection.methodId === method.id ? "text-[var(--editor-accent)]" : "text-[var(--editor-text-muted)] hover:text-[var(--editor-text)]"}`}><FunctionSquare size={11} /><span>{method.name}()</span></button>)}
    </div> : null}
  </div>;
}
