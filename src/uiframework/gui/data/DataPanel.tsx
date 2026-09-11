import { Braces, Tags } from "lucide-react";
import { useState } from "react";
import type { ProjectData } from "../../data/tags/TagDefinition";
import { SegmentedControl, SegmentedControlItem } from "../ui";
import { TagsTree } from "./TagsTree";
import { UdtTree } from "./UdtTree";
import type { DataSelection } from "./data-selection";
import { SimulationStatus } from "./simulation/SimulationStatus";

export function DataPanel({ data, selection, onSelect, projectId }: { data: ProjectData; selection: DataSelection; onSelect(selection: DataSelection): void; projectId?: string | undefined }) {
  const inferredTab = selection?.kind === "udt" || selection?.kind === "udt-method" || selection?.kind === "new-udt" ? "udts" : "tags";
  const [manualTab, setManualTab] = useState<"tags" | "udts" | null>(null);
  const tab = manualTab ?? inferredTab;
  return <div className="space-y-5">
    <div>
      <div className="text-sm font-semibold text-[var(--editor-text)]">Data</div>
      <div className="mt-1 text-xs text-[var(--editor-text-muted)]">Local project tags and reusable data types.</div>
    </div>
    <SegmentedControl className="w-full">
      <SegmentedControlItem active={tab === "tags"} className="flex-1 gap-1.5" onClick={() => setManualTab("tags")}><Tags size={13} /> Tags</SegmentedControlItem>
      <SegmentedControlItem active={tab === "udts"} className="flex-1 gap-1.5" onClick={() => setManualTab("udts")}><Braces size={13} /> UDTs</SegmentedControlItem>
    </SegmentedControl>
    {tab === "tags" ? <>
      <SimulationStatus data={data} projectId={projectId} />
      <TagsTree data={data} selection={selection} onSelect={onSelect} onCreate={() => onSelect({ kind: "new-tag" })} />
    </> : <UdtTree data={data} selection={selection} onSelect={onSelect} onCreate={() => onSelect({ kind: "new-udt" })} />}
  </div>;
}
