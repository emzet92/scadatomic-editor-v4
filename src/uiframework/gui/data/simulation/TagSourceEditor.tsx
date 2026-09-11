import { Cable } from "lucide-react";
import { defaultTagDriverRegistry } from "../../../data/simulation/default-driver-registry";
import type { ProjectData } from "../../../data/tags/TagDefinition";
import type { TagFieldRef } from "../../../data/tags/TagFieldRef";
import {
  getTagSourceMapping,
  setTagSourceDriver,
} from "../../../data/drivers/TagSourceMapping";
import { useEditorStore } from "../../../editor-store";
import { FormField, Select } from "../../ui";

export function TagSourceEditor({
  data,
  target,
}: {
  data: ProjectData;
  target: TagFieldRef;
}) {
  const updateProjectData = useEditorStore((state) => state.updateProjectData);
  const mapping = getTagSourceMapping(data, target);
  const drivers = defaultTagDriverRegistry.list();
  const selectedDescriptor = defaultTagDriverRegistry.get(mapping.driver);

  function changeDriver(driver: string) {
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
          onChange={(event) => changeDriver(event.target.value)}
        >
          {drivers.map((driver) => (
            <option key={driver.kind} value={driver.kind}>
              {driver.displayName}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="text-[10px] leading-4 text-[var(--editor-text-soft)]">
        {mapping.explicit
          ? `Explicitly mapped to ${selectedDescriptor?.displayName ?? mapping.driver}.`
          : "No explicit mapping. Manual is used as the fallback source."}
        {mapping.driver === "simulation"
          ? " Configure optional generators under Data → Drivers → Simulation."
          : " Driver-owned configuration is managed under Data → Drivers."}
      </div>
    </div>
  );
}
