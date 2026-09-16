import { Activity, Play, Square } from "lucide-react";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { ProjectData } from "../../../data/tags/TagDefinition";
import { resolveTagFieldRef } from "../../../data/tags/TagFieldRef";
import { useDesignerTagValue } from "../../../data/tags/designer-tag-store";
import { listSimulationBindings } from "../../../data/simulation/SimulationRegistry";
import { simulationGeneratorRegistry } from "../../../data/simulation/SimulationGeneratorRegistry";
import { sendWsMessage } from "../../../websocket";
import { Button, PanelCard,
  Box,
  Icon,
} from "../../ui";
import { designerSimulationSession } from "../../../data/simulation/designer-simulation-session";

export function SimulationStatus({
  data,
  projectId,
}: {
  data: ProjectData;
  projectId?: string | undefined;
}) {
  const snapshot = useSyncExternalStore(
    (listener) => designerSimulationSession.subscribe(listener),
    () => designerSimulationSession.getSnapshot(),
    () => designerSimulationSession.getSnapshot()
  );
  const activeBindings = useMemo(
    () => listSimulationBindings(data).filter((binding) => binding.enabled),
    [data]
  );

  useEffect(() => {
    designerSimulationSession.configure(data);
    if (snapshot.running && projectId) {
      sendWsMessage({ type: "driver.configure", driver: "simulation", projectId, data });
    }
  }, [data, projectId, snapshot.running]);

  function start() {
    designerSimulationSession.start(data);
    if (projectId) sendWsMessage({ type: "driver.start", driver: "simulation", projectId, data });
  }

  function stop() {
    designerSimulationSession.stop();
    if (projectId) sendWsMessage({ type: "driver.stop", driver: "simulation", projectId });
  }

  const diagnosticsByBinding = new Map(
    snapshot.diagnostics.map((diagnostic) => [diagnostic.bindingId, diagnostic])
  );

  return (
    <PanelCard className="space-y-3">
      <Box className="flex items-center justify-between gap-2">
        <Box className="min-w-0">
          <Box className="flex items-center gap-2 text-xs font-semibold text-[var(--editor-text)]">
            <Icon glyph={Activity} size={13} className={snapshot.running ? "text-emerald-600" : "text-[var(--editor-text-soft)]"} />
            Simulation
          </Box>
          <Box className="mt-1 text-[10px] text-[var(--editor-text-soft)]">
            {snapshot.running ? "Running local simulation driver" : "Stopped"} · {activeBindings.length} active {activeBindings.length === 1 ? "binding" : "bindings"}
          </Box>
        </Box>
        {snapshot.running ? (
          <Button size="xs" variant="secondary" onClick={stop}><Icon glyph={Square} size={11} /> Stop</Button>
        ) : (
          <Button size="xs" variant="primary" disabled={activeBindings.length === 0} onClick={start}><Icon glyph={Play} size={11} /> Start</Button>
        )}
      </Box>

      {activeBindings.length > 0 ? (
        <Box className="space-y-1.5 border-t border-[var(--editor-border)] pt-2">
          {activeBindings.map((binding) => {
            const resolved = resolveTagFieldRef(data, binding.target);
            if (!resolved) return null;
            return (
              <SimulationBindingStatusRow
                key={binding.id}
                path={resolved.path}
                generatorName={`${simulationGeneratorRegistry.get(binding.generator.kind)?.displayName ?? binding.generator.kind}${binding.activation ? " · conditional" : ""}`}
                error={diagnosticsByBinding.get(binding.id)?.message}
              />
            );
          })}
        </Box>
      ) : (
        <Box className="text-[10px] leading-4 text-[var(--editor-text-soft)]">Map fields to Simulation, then add generators only to signals that should be driven automatically.</Box>
      )}
    </PanelCard>
  );
}

function SimulationBindingStatusRow({
  path,
  generatorName,
  error,
}: {
  path: string;
  generatorName: string;
  error?: string | undefined;
}) {
  const value = useDesignerTagValue(path);
  return (
    <Box className="rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] px-2 py-1.5">
      <Box className="flex items-center justify-between gap-2">
        <span className="truncate font-mono text-[10px] text-[var(--editor-text)]">{path}</span>
        <span className="shrink-0 text-[9px] font-medium text-[var(--editor-accent)]">{generatorName}</span>
      </Box>
      <Box className="mt-0.5 flex items-center justify-between gap-2 text-[9px] text-[var(--editor-text-soft)]">
        <span>{error ?? "Current"}</span>
        <span className={error ? "text-red-600" : "font-mono text-[var(--editor-text-muted)]"}>{error ? "error" : formatValue(value)}</span>
      </Box>
    </Box>
  );
}

function formatValue(value: unknown) {
  if (typeof value === "string") return value || '""';
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  return "—";
}
