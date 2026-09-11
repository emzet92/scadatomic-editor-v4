import { Cable } from "lucide-react";
import { defaultTagDriverRegistry } from "../../../data/simulation/default-driver-registry";
import type { ProjectData } from "../../../data/tags/TagDefinition";
import type { TagFieldRef } from "../../../data/tags/TagFieldRef";
import type { PrimitiveDataType } from "../../../data/types/DataType";
import {
  getTagSourceMapping,
  setTagSourceDriver,
  type TagSourceDriverKind,
} from "../../../data/drivers/TagSourceMapping";
import { useEditorStore } from "../../../editor-store";
import { FormField, Select } from "../../ui";
import { SimulationEditor } from "./SimulationEditor";

const SELECTABLE_DRIVERS = new Set<TagSourceDriverKind>(["manual", "simulation"]);

export function TagSourceEditor({
  data,
  target,
  type,
}: {
  data: ProjectData;
  target: TagFieldRef;
  type: PrimitiveDataType;
}) {
  const updateProjectData = useEditorStore((state) => state.updateProjectData);
  const mapping = getTagSourceMapping(data, target);
  const drivers = defaultTagDriverRegistry
    .list()
    .filter((driver) => SELECTABLE_DRIVERS.has(driver.kind as TagSourceDriverKind));
  const selectedDescriptor = defaultTagDriverRegistry.get(mapping.driver);

  function changeDriver(driver: TagSourceDriverKind) {
    updateProjectData((current) => setTagSourceDriver(current, target, driver));
  }

  return (
    <div className="space-y-3 rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-[var(--editor-text)]">
        <Cable size={13} className="text-[var(--editor-accent)]" /> Source
      </div>

      <FormField
        label="Driver"
        compact
        description={selectedDescriptor?.description}
      >
        <Select
          controlSize="sm"
          value={mapping.driver}
          onChange={(event) => changeDriver(event.target.value as TagSourceDriverKind)}
        >
          {drivers.map((driver) => (
            <option key={driver.kind} value={driver.kind}>
              {driver.displayName}
            </option>
          ))}
        </Select>
      </FormField>

      {mapping.driver === "simulation" ? (
        <SimulationEditor data={data} target={target} type={type} />
      ) : (
        <div className="text-[10px] leading-4 text-[var(--editor-text-soft)]">
          Manual source has no driver-owned configuration. Writes from the value editor,
          scripts and TagStore remain authoritative.
        </div>
      )}
    </div>
  );
}
