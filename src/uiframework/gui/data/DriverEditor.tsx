import { Cable, Gauge, Hand } from "lucide-react";
import { defaultTagDriverRegistry } from "../../data/simulation/default-driver-registry";
import { listSimulationBindings } from "../../data/simulation/SimulationRegistry";
import { simulationGeneratorRegistry } from "../../data/simulation/SimulationGeneratorRegistry";
import { resolveTagFieldRef, type TagFieldRef } from "../../data/tags/TagFieldRef";
import type { ProjectData } from "../../data/tags/TagDefinition";
import { PanelCard, SectionHeader } from "../ui";
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

  const isSimulation = driverKind === "simulation";
  const isManual = driverKind === "manual";

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg border border-[var(--editor-border)] bg-[var(--editor-surface)] p-2 text-[var(--editor-accent)]">
          {isSimulation ? <Gauge size={18} /> : isManual ? <Hand size={18} /> : <Cable size={18} />}
        </div>
        <div className="min-w-0">
          <div className="text-xl font-semibold text-[var(--editor-text)]">{descriptor.displayName} driver</div>
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
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--editor-text-soft)]">Mappings</div>
          <div className="mt-2 text-2xl font-semibold text-[var(--editor-text)]">
            {isSimulation ? listSimulationBindings(data).length : "Default"}
          </div>
        </PanelCard>
      </div>

      {isSimulation ? (
        <SimulationDriverWorkspace data={data} projectId={projectId} />
      ) : isManual ? (
        <ManualDriverWorkspace />
      ) : (
        <PanelCard>
          <SectionHeader title="Driver configuration" description="This driver does not expose project-level configuration yet." />
        </PanelCard>
      )}
    </div>
  );
}

function ManualDriverWorkspace() {
  return (
    <PanelCard className="space-y-3">
      <SectionHeader
        title="Manual source"
        description="Manual is the fallback source when a tag field has no explicit driver mapping."
      />
      <div className="text-sm leading-6 text-[var(--editor-text-muted)]">
        Values can be written from the tag value editor, scripts, UDT methods, or directly through TagStore. Manual does not own a scheduler and does not persist a binding record.
      </div>
      <div className="rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] p-3 font-mono text-xs text-[var(--editor-text-muted)]">
        Source → Driver → Manual
      </div>
    </PanelCard>
  );
}

function SimulationDriverWorkspace({
  data,
  projectId,
}: {
  data: ProjectData;
  projectId?: string | undefined;
}) {
  const bindings = listSimulationBindings(data);

  return (
    <div className="space-y-4">
      <SimulationStatus data={data} projectId={projectId} />
      <PanelCard className="space-y-3">
        <SectionHeader
          title="Tag mappings"
          description="Fields mapped to this driver. Configure the generator from the selected tag or UDT field under Source."
        />
        {bindings.length === 0 ? (
          <div className="rounded-md border border-dashed border-[var(--editor-border)] p-4 text-sm text-[var(--editor-text-soft)]">
            No tag fields are mapped to Simulation yet.
          </div>
        ) : (
          <div className="divide-y divide-[var(--editor-border)] overflow-hidden rounded-md border border-[var(--editor-border)]">
            {bindings.map((binding) => (
              <SimulationMappingRow key={binding.id} data={data} target={binding.target} enabled={binding.enabled} generatorKind={binding.generator.kind} />
            ))}
          </div>
        )}
      </PanelCard>
    </div>
  );
}

function SimulationMappingRow({
  data,
  target,
  enabled,
  generatorKind,
}: {
  data: ProjectData;
  target: TagFieldRef;
  enabled: boolean;
  generatorKind: string;
}) {
  const resolved = resolveTagFieldRef(data, target);
  const generator = simulationGeneratorRegistry.get(generatorKind as never);
  return (
    <div className="flex items-center gap-3 bg-[var(--editor-surface)] px-3 py-2.5 text-xs">
      <span className={`h-2 w-2 shrink-0 rounded-full ${enabled ? "bg-emerald-500" : "bg-[var(--editor-border-strong)]"}`} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-mono font-medium text-[var(--editor-text)]">{resolved?.path ?? "Missing target"}</div>
        <div className="mt-0.5 text-[10px] text-[var(--editor-text-soft)]">{enabled ? "Enabled" : "Disabled"}</div>
      </div>
      <div className="shrink-0 text-[10px] font-medium text-[var(--editor-accent)]">
        {generator?.displayName ?? generatorKind}
      </div>
    </div>
  );
}
