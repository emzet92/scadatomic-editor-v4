import type { TagDriver, TagDriverContext } from "../drivers/TagDriver";
import { getTagSourceMapping } from "../drivers/TagSourceMapping";
import { resolveTagFieldRef } from "../tags/TagFieldRef";
import { TypeRegistry } from "../types/TypeRegistry";
import type { RuntimeClock } from "./RuntimeClock";
import { PerformanceRuntimeClock } from "./RuntimeClock";
import type { SimulationBinding } from "./SimulationBinding";
import { simulationGeneratorRegistry } from "./SimulationGeneratorRegistry";
import {
  evaluateSimulationActivation,
  validateSimulationActivation,
} from "./SimulationActivation";
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

/**
 * Local simulation source driver.
 *
 * The driver never owns tag values. It writes generated values through the
 * shared TagStore and reacts to condition inputs by subscribing to the same
 * store. Conditions are event-driven; waveforms are time-driven.
 */
export class SimulationDriver implements TagDriver {
  readonly kind = "simulation";

  private readonly context: TagDriverContext;
  private readonly clock: RuntimeClock;
  private readonly tickMs: number;
  private readonly onDiagnosticsChanged: ((diagnostics: SimulationDriverDiagnostic[]) => void) | undefined;
  private timer: ReturnType<typeof setInterval> | undefined;
  private running = false;
  private startedAt = 0;
  private lastTickAt = 0;
  private diagnostics: SimulationDriverDiagnostic[] = [];
  private readonly activationStartedAt = new Map<string, number>();
  private dependencyIndex = new Map<string, Set<string>>();
  private readonly dependencySubscriptions = new Map<string, () => void>();
  private readonly queuedReactiveBindings = new Set<string>();
  private reactiveFlushQueued = false;

  constructor(context: TagDriverContext, options: SimulationDriverOptions = {}) {
    this.context = context;
    this.clock = options.clock ?? new PerformanceRuntimeClock();
    this.tickMs = Math.max(10, Math.trunc(options.tickMs ?? 50));
    this.onDiagnosticsChanged = options.onDiagnosticsChanged;
  }

  configure() {
    this.syncActivationDependencies(this.context.getProjectData());
    if (this.isRunning()) this.queueAllConditionalBindings();
  }

  start() {
    if (this.running) return;
    this.running = true;
    const now = this.clock.now();
    this.startedAt = now;
    this.lastTickAt = now;
    this.syncActivationDependencies(this.context.getProjectData());
    this.tick(now);
    this.timer = setInterval(() => this.tick(), this.tickMs);
  }

  stop() {
    if (!this.running && this.timer === undefined) return;
    this.running = false;
    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    this.clearDependencySubscriptions();
    this.dependencyIndex.clear();
    this.queuedReactiveBindings.clear();
    this.reactiveFlushQueued = false;
    this.activationStartedAt.clear();
  }

  dispose() {
    this.stop();
    this.updateDiagnostics([]);
  }

  isRunning() {
    return this.running;
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
    this.syncActivationDependencies(data);
    const bindings = listSimulationBindings(data);
    this.pruneBindingState(bindings);

    const diagnostics: SimulationDriverDiagnostic[] = [];
    for (const binding of bindings) {
      const diagnostic = this.evaluateBinding(binding, now, elapsed, delta);
      if (diagnostic) diagnostics.push(diagnostic);
    }
    this.updateDiagnostics(diagnostics);
  }

  private evaluateBinding(
    binding: SimulationBinding,
    now: number,
    elapsed: number,
    delta: number
  ): SimulationDriverDiagnostic | undefined {
    if (!binding.enabled) {
      this.activationStartedAt.delete(binding.id);
      return undefined;
    }

    const data = this.context.getProjectData();
    if (getTagSourceMapping(data, binding.target).driver !== this.kind) {
      this.activationStartedAt.delete(binding.id);
      return undefined;
    }

    try {
      const resolved = resolveTagFieldRef(data, binding.target);
      if (!resolved) {
        return { bindingId: binding.id, message: "Simulation target no longer exists." };
      }

      const descriptor = simulationGeneratorRegistry.get(binding.generator.kind);
      if (!descriptor || !descriptor.supportedTypes.includes(resolved.type.kind)) {
        return {
          bindingId: binding.id,
          path: resolved.path,
          message: `${binding.generator.kind} does not support ${resolved.type.kind}.`,
        };
      }

      const configError = simulationGeneratorRegistry.validate(binding.generator);
      if (configError) {
        return { bindingId: binding.id, path: resolved.path, message: configError };
      }

      let generatorElapsed = elapsed;
      if (binding.activation) {
        const activationError = validateSimulationActivation(
          data,
          resolved.type,
          binding.activation
        );
        if (activationError) {
          this.activationStartedAt.delete(binding.id);
          return { bindingId: binding.id, path: resolved.path, message: activationError };
        }

        const activation = evaluateSimulationActivation(
          data,
          this.context.tagStore,
          binding.activation
        );
        if (!activation.ok) {
          this.activationStartedAt.delete(binding.id);
          return { bindingId: binding.id, path: resolved.path, message: activation.message };
        }

        if (!activation.active) {
          this.activationStartedAt.delete(binding.id);
          if (binding.activation.inactiveBehavior.kind === "set") {
            const inactiveResult = this.context.tagStore.set(
              resolved.path,
              binding.activation.inactiveBehavior.value,
              { source: { kind: "simulation", id: binding.id } }
            );
            if (!inactiveResult.ok) {
              return {
                bindingId: binding.id,
                path: resolved.path,
                message: inactiveResult.error,
              };
            }
          }
          return undefined;
        }

        let activeSince = this.activationStartedAt.get(binding.id);
        if (activeSince === undefined) {
          activeSince = now;
          this.activationStartedAt.set(binding.id, activeSince);
        }
        generatorElapsed = Math.max(0, now - activeSince);
      } else {
        this.activationStartedAt.delete(binding.id);
      }

      const currentValue = this.context.tagStore.get(resolved.path);
      const nextValue = simulationGeneratorRegistry.evaluate(
        {
          now,
          elapsed: generatorElapsed,
          delta,
          currentValue,
          bindingId: binding.id,
          path: resolved.path,
        },
        binding.generator
      );

      if (!TypeRegistry.validate(resolved.type, nextValue)) {
        return {
          bindingId: binding.id,
          path: resolved.path,
          message: "Generator produced a value incompatible with the tag type.",
        };
      }

      const result = this.context.tagStore.set(resolved.path, nextValue, {
        source: { kind: "simulation", id: binding.id },
      });
      if (!result.ok) {
        return { bindingId: binding.id, path: resolved.path, message: result.error };
      }
    } catch (error) {
      return {
        bindingId: binding.id,
        message: error instanceof Error ? error.message : String(error),
      };
    }

    return undefined;
  }

  private syncActivationDependencies(data: ReturnType<TagDriverContext["getProjectData"]>) {
    const nextIndex = new Map<string, Set<string>>();

    for (const binding of listSimulationBindings(data)) {
      if (!binding.enabled || !binding.activation) continue;
      if (getTagSourceMapping(data, binding.target).driver !== this.kind) continue;
      const source = resolveTagFieldRef(data, binding.activation.condition.source);
      if (!source) continue;
      const ids = nextIndex.get(source.path) ?? new Set<string>();
      ids.add(binding.id);
      nextIndex.set(source.path, ids);
    }

    for (const [path, unsubscribe] of this.dependencySubscriptions) {
      if (nextIndex.has(path)) continue;
      unsubscribe();
      this.dependencySubscriptions.delete(path);
    }

    if (this.isRunning()) {
      for (const path of nextIndex.keys()) {
        if (this.dependencySubscriptions.has(path)) continue;
        this.dependencySubscriptions.set(
          path,
          this.context.tagStore.subscribe(path, () => this.handleDependencyChanged(path))
        );
      }
    }

    this.dependencyIndex = nextIndex;
  }

  private handleDependencyChanged(path: string) {
    if (!this.isRunning()) return;
    const bindingIds = this.dependencyIndex.get(path);
    if (!bindingIds) return;
    for (const bindingId of bindingIds) this.queuedReactiveBindings.add(bindingId);
    this.queueReactiveFlush();
  }

  private queueAllConditionalBindings() {
    for (const bindingIds of this.dependencyIndex.values()) {
      for (const bindingId of bindingIds) this.queuedReactiveBindings.add(bindingId);
    }
    this.queueReactiveFlush();
  }

  private queueReactiveFlush() {
    if (this.reactiveFlushQueued || this.queuedReactiveBindings.size === 0) return;
    this.reactiveFlushQueued = true;
    queueMicrotask(() => {
      this.reactiveFlushQueued = false;
      if (!this.isRunning()) {
        this.queuedReactiveBindings.clear();
        return;
      }

      const bindingIds = new Set(this.queuedReactiveBindings);
      this.queuedReactiveBindings.clear();
      const bindings = listSimulationBindings(this.context.getProjectData()).filter(
        (binding) => bindingIds.has(binding.id)
      );
      const now = this.clock.now();
      const elapsed = Math.max(0, now - this.startedAt);
      const nextDiagnostics = this.diagnostics.filter(
        (diagnostic) => !bindingIds.has(diagnostic.bindingId)
      );

      for (const binding of bindings) {
        const diagnostic = this.evaluateBinding(binding, now, elapsed, 0);
        if (diagnostic) nextDiagnostics.push(diagnostic);
      }
      this.updateDiagnostics(nextDiagnostics);
    });
  }

  private pruneBindingState(bindings: SimulationBinding[]) {
    const knownBindingIds = new Set(bindings.map((binding) => binding.id));
    for (const bindingId of this.activationStartedAt.keys()) {
      if (!knownBindingIds.has(bindingId)) this.activationStartedAt.delete(bindingId);
    }
  }

  private clearDependencySubscriptions() {
    for (const unsubscribe of this.dependencySubscriptions.values()) unsubscribe();
    this.dependencySubscriptions.clear();
  }

  private updateDiagnostics(next: SimulationDriverDiagnostic[]) {
    const previousKey = JSON.stringify(this.diagnostics);
    const nextKey = JSON.stringify(next);
    if (previousKey === nextKey) return;
    this.diagnostics = next;
    this.onDiagnosticsChanged?.([...next]);
  }
}
