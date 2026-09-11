import { Cable, Gauge, Hand, Link2, Unlink } from "lucide-react";
import { defaultTagDriverRegistry } from "../../data/simulation/default-driver-registry";
import {
  clearTagSourceDriverMapping,
  getTagSourceMapping,
  setTagSourceDriver,
} from "../../data/drivers/TagSourceMapping";
import {
  listPrimitiveTagFieldRefs,
  resolveTagFieldRef,
  type ResolvedTagFieldRef,
  type TagFieldRef,
} from "../../data/tags/TagFieldRef";
import type { ProjectData } from "../../data/tags/TagDefinition";
import { useEditorStore } from "../../editor-store";
import { useDesignerTagValue } from "../../data/tags/designer-tag-store";
import {
  createSimulationBinding,
  findSimulationBinding,
  removeSimulationBindingForTarget,
  upsertSimulationBinding,
} from "../../data/simulation/SimulationRegistry";
import { Button, PanelCard, SectionHeader } from "../ui";
import { SimulationEditor } from "./simulation/SimulationEditor";
import { SimulationStatus } from "./simulation/SimulationStatus";

export function DriverEditor({
  data,
  driverKind,
  projectId,
}: {
  data: ProjectData;
  driverKind: string;
  projectId?: string | undefined;
}) {
  const descriptor = defaultTagDriverRegistry.get(driverKind);
  if (!descriptor) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <PanelCard>Unknown driver: {driverKind}</PanelCard>
      </div>
    );
  }

  const fields = listPrimitiveTagFieldRefs(data);
  const mappedCount = fields.filter(
    (field) => getTagSourceMapping(data, field.ref).driver === driverKind
  ).length;
  const isSimulation = driverKind === "simulation";
  const isManual = driverKind === "manual";

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg border border-[var(--editor-border)] bg-[var(--editor-surface)] p-2 text-[var(--editor-accent)]">
          {isSimulation ? (
            <Gauge size={18} />
          ) : isManual ? (
            <Hand size={18} />
          ) : (
            <Cable size={18} />
          )}
        </div>
        <div className="min-w-0">
          <div className="text-xl font-semibold text-[var(--editor-text)]">
            {descriptor.displayName} driver
          </div>
          <div className="mt-1 max-w-2xl text-sm text-[var(--editor-text-muted)]">
            {descriptor.description ?? "Project tag source driver."}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <PanelCard>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--editor-text-soft)]">Kind</div>
          <div className="mt-2 font-mono text-sm text-[var(--editor-text)]">{descriptor.kind}</div>
        </PanelCard>
        <PanelCard>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--editor-text-soft)]">Availability</div>
          <div className="mt-2 text-sm font-medium text-[var(--editor-text)]">Built in</div>
        </PanelCard>
        <PanelCard>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--editor-text-soft)]">Resolved fields</div>
          <div className="mt-2 text-2xl font-semibold text-[var(--editor-text)]">{mappedCount}</div>
        </PanelCard>
      </div>

      {isSimulation ? <SimulationStatus data={data} projectId={projectId} /> : null}

      <DriverMappingsWorkspace data={data} driverKind={driverKind} />

      {isManual ? (
        <PanelCard className="space-y-3">
          <SectionHeader
            title="Manual fallback"
            description="Fields without any explicit source mapping also resolve to Manual. Explicit Manual mappings are useful when you want driver ownership to be intentional and swappable as a set."
          />
          <div className="rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] p-3 font-mono text-xs text-[var(--editor-text-muted)]">
            no mapping → Manual
          </div>
        </PanelCard>
      ) : null}
    </div>
  );
}

function DriverMappingsWorkspace({
  data,
  driverKind,
}: {
  data: ProjectData;
  driverKind: string;
}) {
  const fields = listPrimitiveTagFieldRefs(data);
  const updateProjectData = useEditorStore((state) => state.updateProjectData);

  function mapHere(target: TagFieldRef) {
    updateProjectData((current) => setTagSourceDriver(current, target, driverKind));
  }

  function unmap(target: TagFieldRef) {
    updateProjectData((current) => clearTagSourceDriverMapping(current, target));
  }

  return (
    <PanelCard className="space-y-3">
      <SectionHeader
        title="Tag mappings"
        description="Assign primitive tags and UDT fields to this driver. One field has at most one active source driver; mapping it here moves ownership from the previous driver."
      />

      {fields.length === 0 ? (
        <div className="rounded-md border border-dashed border-[var(--editor-border)] p-4 text-sm text-[var(--editor-text-soft)]">
          Create a primitive tag or a UDT field first.
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field) => (
            <DriverMappingRow
              key={`${field.ref.tagId}:${field.ref.fieldIds.join("/")}`}
              data={data}
              field={field}
              driverKind={driverKind}
              onMap={() => mapHere(field.ref)}
              onUnmap={() => unmap(field.ref)}
            />
          ))}
        </div>
      )}
    </PanelCard>
  );
}

function DriverMappingRow({
  data,
  field,
  driverKind,
  onMap,
  onUnmap,
}: {
  data: ProjectData;
  field: ResolvedTagFieldRef;
  driverKind: string;
  onMap(): void;
  onUnmap(): void;
}) {
  const mapping = getTagSourceMapping(data, field.ref);
  const mappedHere = mapping.driver === driverKind;
  const currentDriver = defaultTagDriverRegistry.get(mapping.driver);
  const canUnmap = mappedHere && mapping.explicit;
  const liveValue = useDesignerTagValue(field.path);

  return (
    <div className="overflow-hidden rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface)]">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            mappedHere ? "bg-emerald-500" : "bg-[var(--editor-border-strong)]"
          }`}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-xs font-medium text-[var(--editor-text)]">
            {field.path}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-[var(--editor-text-soft)]">
            <span>
              {mappedHere
                ? mapping.explicit
                  ? `Explicit ${currentDriver?.displayName ?? mapping.driver} mapping`
                  : "Manual fallback"
                : `Current source: ${currentDriver?.displayName ?? mapping.driver}`}
            </span>
            {mappedHere ? (
              <span className="font-mono text-[var(--editor-text-muted)]">live={formatDriverValue(liveValue)}</span>
            ) : null}
          </div>
        </div>

        {mappedHere && canUnmap ? (
          <Button size="xs" variant="secondary" onClick={onUnmap}>
            <Unlink size={11} /> Unmap
          </Button>
        ) : mappedHere ? (
          <Button size="xs" variant="secondary" onClick={onMap}>
            <Link2 size={11} /> Map explicitly
          </Button>
        ) : (
          <Button size="xs" variant="primary" onClick={onMap}>
            <Link2 size={11} /> Map here
          </Button>
        )}
      </div>

      {mappedHere && driverKind === "simulation" ? (
        <div className="border-t border-[var(--editor-border)] bg-[var(--editor-surface-muted)] px-3 pb-3">
          <SimulationConfigForTarget data={data} target={field.ref} />
        </div>
      ) : null}
    </div>
  );
}

function SimulationConfigForTarget({
  data,
  target,
}: {
  data: ProjectData;
  target: TagFieldRef;
}) {
  const resolved = resolveTagFieldRef(data, target);
  const binding = findSimulationBinding(data, target);
  const updateProjectData = useEditorStore((state) => state.updateProjectData);
  if (!resolved) return null;

  function addGenerator() {
    updateProjectData((current) => {
      if (findSimulationBinding(current, target)) return current;
      return upsertSimulationBinding(current, createSimulationBinding(current, target));
    });
  }

  function removeGenerator() {
    updateProjectData((current) => removeSimulationBindingForTarget(current, target));
  }

  if (!binding) {
    return (
      <div className="flex items-center justify-between gap-3 pt-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-[var(--editor-text)]">Writable simulated register</div>
          <div className="mt-0.5 text-[10px] leading-4 text-[var(--editor-text-soft)]">
            Application writes are routed to SimulationDriver and read back through TagStore. Add a generator only for signals that should be driven by simulated process behavior.
          </div>
        </div>
        <Button size="xs" variant="secondary" onClick={addGenerator}>Add generator</Button>
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold text-[var(--editor-text)]">Generated signal</div>
          <div className="text-[10px] text-[var(--editor-text-soft)]">The driver owns this register and also updates it from the configured generator.</div>
        </div>
        <Button size="xs" variant="secondary" onClick={removeGenerator}>Remove generator</Button>
      </div>
      <SimulationEditor data={data} target={target} type={resolved.type} />
    </div>
  );
}

function formatDriverValue(value: unknown) {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "—";
}
