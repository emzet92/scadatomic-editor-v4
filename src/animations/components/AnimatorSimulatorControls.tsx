import { useState } from "react";
import {
  Box,
  Button,
  PanelCard,
  PlayIcon,
  ResetIcon,
  SectionHeader,
  SquareIcon,
} from "../../shared/ui";
import {
  useResolvedProcessBindings,
  type ProcessScene,
  type ProcessTagBindings,
} from "../../processes";
import type { TagEngineAnimatorSimulationSession } from "../infrastructure/TagEngineAnimatorSimulationSession";

export function AnimatorSimulatorControls({
  session,
  running,
  bindings,
  scene,
  onStart,
  onStop,
  onReset,
  onRestart,
}: {
  session: TagEngineAnimatorSimulationSession | null;
  running: boolean;
  bindings: ProcessTagBindings;
  scene: ProcessScene;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onRestart: () => void;
}) {
  const values = useResolvedProcessBindings(bindings, session);
  const [error, setError] = useState<string | null>(null);

  function write(path: string, value: unknown) {
    if (!session) return;
    const result = session.write(path, value);
    setError(result.ok ? null : result.error);
  }

  const progress = bindings.progress;
  const state = bindings.objectState;
  const stateRawValue = state && session ? session.read(state.tagPath) : undefined;

  return (
    <PanelCard className="rounded-xl p-4 shadow-sm">
      <SectionHeader
        title="Animator simulator"
        description="Private simulator session for this workspace. Manual controls never write to the project runtime."
      />

      <Box className="mt-4 space-y-4">
        <Box className="flex flex-wrap items-center gap-2">
          {running ? (
            <Button size="sm" variant="danger" onClick={onStop}><SquareIcon size={12} /> Stop generators</Button>
          ) : (
            <Button size="sm" variant="primary" disabled={!session} onClick={onStart}><PlayIcon size={12} /> Start generators</Button>
          )}
          <Button size="sm" disabled={!session} onClick={onRestart}><ResetIcon size={12} /> Restart</Button>
          <Button size="sm" disabled={!session} onClick={onReset}>Reset values</Button>
          <span className={`text-[10px] font-semibold ${running ? "text-emerald-600" : "text-[var(--editor-text-soft)]"}`}>
            {session ? (running ? "isolated session · running" : "isolated session · stopped") : "simulator unavailable"}
          </span>
        </Box>

        {progress ? (
          <Box className="space-y-2 rounded-lg border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] p-3">
            <Box className="flex items-center justify-between gap-3 text-[10px]">
              <span className="font-semibold text-[var(--editor-text)]">Progress</span>
              <span className="font-mono text-[var(--editor-text-muted)]">{progress.tagPath} · {((values.progress ?? 0) * 100).toFixed(1)}%</span>
            </Box>
            <input
              aria-label="Animator simulator progress"
              type="range"
              min={0}
              max={1}
              step={0.001}
              disabled={!session}
              value={values.progress ?? 0}
              onChange={(event) => {
                const normalized = Number(event.target.value);
                const raw = progress.inputMin + normalized * (progress.inputMax - progress.inputMin);
                write(progress.tagPath, raw);
              }}
              className="w-full accent-[var(--editor-accent)]"
            />
          </Box>
        ) : null}

        {state ? (
          <Box className="space-y-2 rounded-lg border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] p-3">
            <Box className="flex items-center justify-between gap-3 text-[10px]">
              <span className="font-semibold text-[var(--editor-text)]">Object state</span>
              <span className="font-mono text-[var(--editor-text-muted)]">{state.tagPath} · {formatValue(stateRawValue)}</span>
            </Box>
            {state.mapping && Object.keys(state.mapping).length > 0 ? (
              <Box className="flex flex-wrap gap-1.5">
                {Object.entries(state.mapping).map(([rawValue, semanticState]) => (
                  <Button
                    key={rawValue}
                    size="xs"
                    variant={values.objectState === semanticState ? "primary" : "secondary"}
                    disabled={!session}
                    onClick={() => write(state.tagPath, coerceLike(rawValue, stateRawValue))}
                  >
                    {rawValue} → {semanticState}
                  </Button>
                ))}
              </Box>
            ) : (
              <Box className="text-[10px] leading-4 text-[var(--editor-text-soft)]">
                Add a state mapping in Process bindings to get one-click state controls.
              </Box>
            )}
          </Box>
        ) : null}

        {scene.sensors.length > 0 ? (
          <Box className="space-y-2 rounded-lg border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] p-3">
            <Box className="text-[10px] font-semibold text-[var(--editor-text)]">Sensors</Box>
            <Box className="flex flex-wrap gap-1.5">
              {scene.sensors.map((sensor) => {
                const binding = bindings.sensors?.[sensor.id];
                if (!binding) return null;
                const active = values.sensorStates[sensor.id] ?? false;
                const activeValue = binding.activeValue ?? true;
                return (
                  <Button
                    key={sensor.id}
                    size="xs"
                    variant={active ? "primary" : "secondary"}
                    disabled={!session}
                    onClick={() => write(binding.tagPath, active ? !activeValue : activeValue)}
                  >
                    {sensor.name}: {active ? "ON" : "OFF"}
                  </Button>
                );
              })}
            </Box>
          </Box>
        ) : null}

        {!progress && !state && Object.keys(bindings.sensors ?? {}).length === 0 ? (
          <Box className="rounded-lg border border-dashed border-[var(--editor-border-strong)] px-3 py-2 text-[10px] leading-4 text-[var(--editor-text-soft)]">
            Bind progress, object state or sensors to project tags to expose simulator controls here.
          </Box>
        ) : null}

        {error ? <Box className="text-[10px] font-semibold text-red-600">{error}</Box> : null}
      </Box>
    </PanelCard>
  );
}

function coerceLike(value: string, example: unknown): unknown {
  if (typeof example === "number") {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : value;
  }
  if (typeof example === "boolean") return value === "true";
  return value;
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return value || '\"\"';
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  return "—";
}
