import { Braces, Cable, Tags } from "lucide-react";
import { useState } from "react";
import type { ProjectData } from "../../data/tags/TagDefinition";
import { SegmentedControl, SegmentedControlItem, SidebarSection } from "../ui";
import { DriversTree } from "./DriversTree";
import { TagsTree } from "./TagsTree";
import { UdtTree } from "./UdtTree";
import type { DataSelection } from "./data-selection";

export function DataPanel({
  data,
  selection,
  onSelect,
}: {
  data: ProjectData;
  selection: DataSelection;
  onSelect(selection: DataSelection): void;
  projectId?: string | undefined;
}) {
  const inferredTab = selection?.kind === "driver"
    ? "drivers"
    : selection?.kind === "udt" || selection?.kind === "udt-method" || selection?.kind === "new-udt"
      ? "udts"
      : "tags";
  const [manualTab, setManualTab] = useState<"tags" | "udts" | "drivers" | null>(null);
  const tab = manualTab ?? inferredTab;

  return (
    <SidebarSection
      title="Data"
      description="Local project tags and reusable data types."
      className="space-y-5"
    >
      <SegmentedControl fullWidth>
        <SegmentedControlItem active={tab === "tags"} grow className="gap-1.5" onClick={() => setManualTab("tags")}>
          <Tags size={13} /> Tags
        </SegmentedControlItem>
        <SegmentedControlItem active={tab === "udts"} grow className="gap-1.5" onClick={() => setManualTab("udts")}>
          <Braces size={13} /> UDTs
        </SegmentedControlItem>
        <SegmentedControlItem active={tab === "drivers"} grow className="gap-1.5" onClick={() => setManualTab("drivers")}>
          <Cable size={13} /> Drivers
        </SegmentedControlItem>
      </SegmentedControl>
      {tab === "tags" ? (
        <TagsTree data={data} selection={selection} onSelect={onSelect} onCreate={() => onSelect({ kind: "new-tag" })} />
      ) : tab === "udts" ? (
        <UdtTree data={data} selection={selection} onSelect={onSelect} onCreate={() => onSelect({ kind: "new-udt" })} />
      ) : (
        <DriversTree selection={selection} onSelect={onSelect} />
      )}
    </SidebarSection>
  );
}
