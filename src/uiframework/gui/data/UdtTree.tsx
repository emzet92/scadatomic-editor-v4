import { useState } from "react";
import type { ProjectData } from "../../data/tags/TagDefinition";
import { TypeRegistry } from "../../data/types/TypeRegistry";
import {
  AddIcon,
  Box,
  BracesIcon,
  Callout,
  ChevronRightIcon,
  FunctionIcon,
  IconButton,
  Pressable,
  SidebarSection
} from "../ui";
import type { DataSelection } from "./data-selection";

export function UdtTree({ data, selection, onSelect, onCreate }: { data: ProjectData; selection: DataSelection; onSelect(selection: DataSelection): void; onCreate(): void }) {
  const udts = Object.values(data.udts).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <SidebarSection
      title="UDTs"
      actions={<IconButton aria-label="Create UDT" variant="secondary" onClick={onCreate}><AddIcon size={14} /></IconButton>}
    >
      <Box className="space-y-0.5">
        {udts.length === 0 ? (
          <Callout dashed size="sm">No UDT definitions yet.</Callout>
        ) : udts.map((udt) => (
          <UdtRow key={udt.id} udt={udt} data={data} selection={selection} onSelect={onSelect} />
        ))}
      </Box>
    </SidebarSection>
  );
}

function UdtRow({ udt, data, selection, onSelect }: { udt: ProjectData["udts"][string]; data: ProjectData; selection: DataSelection; onSelect(selection: DataSelection): void }) {
  const [expanded, setExpanded] = useState(true);
  const active = (selection?.kind === "udt" || selection?.kind === "udt-method") && selection.udtId === udt.id;
  return <Box>
    <Box className={`flex h-8 items-center rounded-md pr-2 text-xs ${active ? "bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]" : "text-[var(--editor-text)] hover:bg-[var(--editor-surface)]"}`}>
      <Pressable type="button" onClick={() => setExpanded((value) => !value)} className="inline-flex h-6 w-6 items-center justify-center text-[var(--editor-text-soft)]"><ChevronRightIcon size={12} className={expanded ? "rotate-90" : ""} /></Pressable>
      <Pressable type="button" onClick={() => onSelect({ kind: "udt", udtId: udt.id })} className="flex min-w-0 flex-1 items-center gap-2 text-left"><BracesIcon size={13} /><span className="truncate font-medium">{udt.name}</span></Pressable>
    </Box>
    {expanded ? <Box className="ml-8 space-y-0.5 border-l border-[var(--editor-border)] pl-3 py-1">
      {udt.fields.map((field) => <Pressable key={field.id} type="button" onClick={() => onSelect({ kind: "udt", udtId: udt.id })} className="flex h-7 w-full items-center justify-between gap-2 text-left text-[11px] text-[var(--editor-text-muted)] hover:text-[var(--editor-text)]"><span>{field.name}</span><span className="text-[10px] text-[var(--editor-text-soft)]">{TypeRegistry.getDisplayName(field.type, field.type.kind === "udt" ? data.udts[field.type.udtId]?.name : undefined)}</span></Pressable>)}
      {udt.methods.map((method) => <Pressable key={method.id} type="button" onClick={() => onSelect({ kind: "udt-method", udtId: udt.id, methodId: method.id })} className={`flex h-7 w-full items-center gap-2 text-left text-[11px] ${selection?.kind === "udt-method" && selection.methodId === method.id ? "text-[var(--editor-accent)]" : "text-[var(--editor-text-muted)] hover:text-[var(--editor-text)]"}`}><FunctionIcon size={11} /><span>{method.name}()</span></Pressable>)}
    </Box> : null}
  </Box>;
}
