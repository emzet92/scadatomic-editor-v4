import type { TagDriver, TagDriverContext } from "../drivers/TagDriver";
import { getTagSourceMapping } from "../drivers/TagSourceMapping";
import { resolveTagFieldRef } from "../tags/TagFieldRef";
import { TypeRegistry } from "../types/TypeRegistry";
import type { RuntimeClock } from "./RuntimeClock";
import { PerformanceRuntimeClock } from "./RuntimeClock";
import { simulationGeneratorRegistry } from "./SimulationGeneratorRegistry";
import { listSimulationBindings } from "./SimulationRegistry";

export type SimulationDriverDiagnostic = {
  bindingId: string;
  path?: string | undefined;
  message: string;
};

export type SimulationDriverOptions = {
  tickMs?: number | undefined;
  clock?: RuntimeClock | undefined;
  onDiagnosticsChanged?: ((diagnostics: SimulationDriverDiagnostic[]) => void) | undefined;
};

export class SimulationDriver implements TagDriver {
  readonly kind = "simulation";

  private readonly context: TagDriverContext;
  private readonly clock: RuntimeClock;
  private readonly tickMs: number;
  private readonly onDiagnosticsChanged: ((diagnostics: SimulationDriverDiagnostic[]) => void) | undefined;
  private timer: ReturnType<typeof setInterval> | undefined;
  private startedAt = 0;
  private lastTickAt = 0;
  private diagnostics: SimulationDriverDiagnostic[] = [];

  constructor(context: TagDriverContext, options: SimulationDriverOptions = {}) {
    this.context = context;
    this.clock = options.clock ?? new PerformanceRuntimeClock();
    this.tickMs = Math.max(10, Math.trunc(options.tickMs ?? 50));
    this.onDiagnosticsChanged = options.onDiagnosticsChanged;
  }

  start() {
    if (this.timer !== undefined) return;
    const now = this.clock.now();
    this.startedAt = now;
    this.lastTickAt = now;
    this.tick(now);
    this.timer = setInterval(() => this.tick(), this.tickMs);
  }

  stop() {
    if (this.timer === undefined) return;
    clearInterval(this.timer);
    this.timer = undefined;
  }

  dispose() {
    this.stop();
    this.updateDiagnostics([]);
  }

  isRunning() {
    return this.timer !== undefined;
  }

  getDiagnostics() {
    return [...this.diagnostics];
  }

  /** Deterministic entry point used by tests and manual simulation clocks. */
  tick(forcedNow?: number) {
    const now = forcedNow ?? this.clock.now();
    const elapsed = Math.max(0, now - this.startedAt);
    const delta = Math.max(0, now - this.lastTickAt);
    this.lastTickAt = now;

    const data = this.context.getProjectData();
    const diagnostics: SimulationDriverDiagnostic[] = [];

    for (const binding of listSimulationBindings(data)) {
      if (!binding.enabled) continue;
      if (getTagSourceMapping(data, binding.target).driver !== this.kind) continue;

      try {
        const resolved = resolveTagFieldRef(data, binding.target);
        if (!resolved) {
          diagnostics.push({ bindingId: binding.id, message: "Simulation target no longer exists." });
          continue;
        }

        const descriptor = simulationGeneratorRegistry.get(binding.generator.kind);
        if (!descriptor || !descriptor.supportedTypes.includes(resolved.type.kind)) {
          diagnostics.push({ bindingId: binding.id, path: resolved.path, message: `${binding.generator.kind} does not support ${resolved.type.kind}.` });
          continue;
        }

        const configError = simulationGeneratorRegistry.validate(binding.generator);
        if (configError) {
          diagnostics.push({ bindingId: binding.id, path: resolved.path, message: configError });
          continue;
        }

        const currentValue = this.context.tagStore.get(resolved.path);
        const nextValue = simulationGeneratorRegistry.evaluate(
          {
            now,
            elapsed,
            delta,
            currentValue,
            bindingId: binding.id,
            path: resolved.path,
          },
          binding.generator
        );

        if (!TypeRegistry.validate(resolved.type, nextValue)) {
          diagnostics.push({ bindingId: binding.id, path: resolved.path, message: "Generator produced a value incompatible with the tag type." });
          continue;
        }

        const result = this.context.tagStore.set(resolved.path, nextValue, {
          source: { kind: "simulation", id: binding.id },
        });
        if (!result.ok) {
          diagnostics.push({ bindingId: binding.id, path: resolved.path, message: result.error });
        }
      } catch (error) {
        diagnostics.push({
          bindingId: binding.id,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    this.updateDiagnostics(diagnostics);
  }

  private updateDiagnostics(next: SimulationDriverDiagnostic[]) {
    const previousKey = JSON.stringify(this.diagnostics);
    const nextKey = JSON.stringify(next);
    if (previousKey === nextKey) return;
    this.diagnostics = next;
    this.onDiagnosticsChanged?.([...next]);
  }
}
