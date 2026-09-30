import type { StateMachineDefinition } from "../domain/state-machine-definition";
import { createStateMachineInstance, type StateMachineInstance } from "../domain/state-machine-instance";
import type { StateMachineIntent } from "../domain/state-machine-intent";
import { initializeStateMachine, stepStateMachine, type StateMachineEvent } from "../engine/step-state-machine";
import type { StateMachineClock, StateMachineEffectSink, StateMachineScheduler, StateMachineValueSource } from "./StateMachinePorts";

export class StateMachineRuntime {
  readonly definition: StateMachineDefinition;
  private readonly values: StateMachineValueSource;
  private readonly effects: StateMachineEffectSink;
  private readonly clock: StateMachineClock;
  private readonly scheduler: StateMachineScheduler;
  private instance: StateMachineInstance;
  private readonly listeners = new Set<() => void>();
  private subscriptions: Array<() => void> = [];
  private tickUnsubscribe: (() => void) | null = null;
  private chain: Promise<void> = Promise.resolve();
  private running = false;
  private generation = 0;

  constructor(
    definition: StateMachineDefinition,
    values: StateMachineValueSource,
    effects: StateMachineEffectSink,
    clock: StateMachineClock,
    scheduler: StateMachineScheduler,
  ) {
    this.definition = definition;
    this.values = values;
    this.effects = effects;
    this.clock = clock;
    this.scheduler = scheduler;
    this.instance = createStateMachineInstance(definition.id, definition.initialStateId, clock.now());
  }

  start() {
    this.stop();
    const generation = ++this.generation;
    this.running = true;
    for (const path of collectReferencedTagPaths(this.definition)) {
      this.subscriptions.push(this.values.subscribe(path, () => this.schedule()));
    }
    this.tickUnsubscribe = this.scheduler.every(50, () => this.schedule());
    this.chain = this.chain.then(() => this.initialize(generation)).catch((error) => console.error("State-machine runtime failed", error));
  }

  stop() {
    this.running = false;
    this.generation += 1;
    for (const unsubscribe of this.subscriptions.splice(0)) unsubscribe();
    this.tickUnsubscribe?.();
    this.tickUnsubscribe = null;
  }

  reset() {
    if (!this.running) {
      this.instance = createStateMachineInstance(this.definition.id, this.definition.initialStateId, this.clock.now());
      this.emit();
      return;
    }
    const generation = this.generation;
    this.chain = this.chain.then(() => this.initialize(generation)).catch((error) => console.error("State-machine reset failed", error));
  }

  dispatch(event: StateMachineEvent) { this.schedule(event); }
  snapshot() { return structuredClone(this.instance); }
  subscribe(listener: () => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }

  private schedule(event?: StateMachineEvent) {
    if (!this.running) return;
    const generation = this.generation;
    this.chain = this.chain.then(() => this.runCycle(event, generation)).catch((error) => console.error("State-machine runtime failed", error));
  }

  private async initialize(generation: number) {
    if (!this.running || generation !== this.generation) return;
    const result = initializeStateMachine(this.definition, this.clock.now());
    this.instance = result.instance;
    for (const intent of result.intents) await executeIntent(intent, this.effects);
    this.emit();
    await this.runCycle(undefined, generation);
  }

  private async runCycle(initialEvent: StateMachineEvent | undefined, generation: number) {
    let event = initialEvent;
    for (let index = 0; index < 50; index += 1) {
      if (!this.running || generation !== this.generation) return;
      const result = stepStateMachine({
        definition: this.definition,
        instance: this.instance,
        ...(event ? { event } : {}),
        values: { readTag: (path) => this.values.read(path) },
        now: this.clock.now(),
      });
      if (!result.transition) return;
      this.instance = result.instance;
      for (const intent of result.intents) await executeIntent(intent, this.effects);
      this.emit();
      event = undefined;
    }
    throw new Error(`State machine ${this.definition.id} exceeded 50 automatic transitions; possible transition loop.`);
  }

  private emit() { for (const listener of this.listeners) listener(); }
}

async function executeIntent(intent: StateMachineIntent, effects: StateMachineEffectSink) {
  if (intent.type === "set-tag") return effects.setTag(intent.path, intent.value);
  if (intent.type === "emit-event") return effects.emitEvent(intent.event, intent.payload);
}

export function collectReferencedTagPaths(definition: StateMachineDefinition): string[] {
  const paths = new Set<string>();
  const visitGuard = (guard: import("../domain/state-machine-definition").GuardExpression | undefined) => {
    if (!guard) return;
    if (guard.kind === "compare") {
      if (guard.left.kind === "tag") paths.add(guard.left.path);
    } else if (guard.kind === "truthy") {
      if (guard.value.kind === "tag") paths.add(guard.value.path);
    } else if (guard.kind === "not") visitGuard(guard.expression);
    else if (guard.kind === "and" || guard.kind === "or") guard.expressions.forEach(visitGuard);
  };
  for (const transition of definition.transitions) visitGuard(transition.guard);
  return [...paths];
}
