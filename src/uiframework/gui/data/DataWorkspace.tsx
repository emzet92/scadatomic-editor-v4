import { Braces, Database, RadioTower, Tags } from "lucide-react";
import type { ProjectData } from "../../data/tags/TagDefinition";
import { PanelCard } from "../ui";
import { CreateTagEditor } from "./CreateTagEditor";
import { CreateUdtEditor } from "./CreateUdtEditor";
import { TagEditor } from "./TagEditor";
import { UdtEditor } from "./UdtEditor";
import { UdtMethodEditor } from "./UdtMethodEditor";
import type { DataSelection } from "./data-selection";

export function DataWorkspace({ data, selection, onSelect }: { data: ProjectData; selection: DataSelection; onSelect(selection: DataSelection): void }) {
  if (selection?.kind === "new-tag") return <CreateTagEditor data={data} onSelect={onSelect} />;
  if (selection?.kind === "new-udt") return <CreateUdtEditor data={data} onSelect={onSelect} />;
  if (selection?.kind === "tag") return <TagEditor key={selection.tagId} data={data} tagId={selection.tagId} onSelect={onSelect} />;
  if (selection?.kind === "udt") return <UdtEditor key={selection.udtId} data={data} udtId={selection.udtId} onSelect={onSelect} />;
  if (selection?.kind === "udt-method") return <UdtMethodEditor key={selection.methodId} data={data} udtId={selection.udtId} methodId={selection.methodId} />;

  return <div className="mx-auto max-w-5xl space-y-6 p-8">
    <div><div className="flex items-center gap-2 text-xl font-semibold text-[var(--editor-text)]"><Database size={20} /> Project Data</div><p className="mt-1 text-sm text-[var(--editor-text-muted)]">Local typed data runtime for data-driven UI. No PLC or device layer is involved.</p></div>
    <div className="grid gap-4 md:grid-cols-3">
      <PanelCard><Tags size={18} className="text-[var(--editor-accent)]" /><div className="mt-3 text-2xl font-semibold">{Object.keys(data.tags).length}</div><div className="text-xs text-[var(--editor-text-muted)]">Tags</div></PanelCard>
      <PanelCard><Braces size={18} className="text-[var(--editor-accent)]" /><div className="mt-3 text-2xl font-semibold">{Object.keys(data.udts).length}</div><div className="text-xs text-[var(--editor-text-muted)]">UDT definitions</div></PanelCard>
      <PanelCard><RadioTower size={18} className="text-[var(--editor-accent)]" /><div className="mt-3 text-sm font-semibold">Event driven</div><div className="mt-2 text-xs text-[var(--editor-text-muted)]">TagStore subscriptions, no polling.</div></PanelCard>
    </div>
    <PanelCard className="text-sm text-[var(--editor-text-muted)]"><strong className="text-[var(--editor-text)]">Runtime rule:</strong> all value mutations pass through TagStore. A real change emits <code className="font-mono text-[var(--editor-accent)]">tag.changed</code> with path, oldValue and newValue.</PanelCard>
  </div>;
}
