import type { MachineValue, StateMachineDefinition } from "../domain/state-machine-definition";
import type { StateMachineInstance } from "../domain/state-machine-instance";
import type { StateMachineIntent } from "../domain/state-machine-intent";
import { initializeStateMachine, stepStateMachine } from "../engine/step-state-machine";

export class StateMachineSimulationSession {
  readonly definition: StateMachineDefinition;
  private nowMs = 0;
  private instanceValue: StateMachineInstance;
  private readonly tags = new Map<string, unknown>();
  private readonly intentLog: Array<{ at: number; intent: StateMachineIntent }> = [];
  private lastTransitionId: string | null = null;

  constructor(definition: StateMachineDefinition) {
    this.definition = definition;
    const initial = initializeStateMachine(definition, this.nowMs);
    this.instanceValue = initial.instance;
    for (const intent of initial.intents) this.recordIntent(intent);
    this.settle();
  }

  get now() { return this.nowMs; }
  get instance() { return structuredClone(this.instanceValue); }
  get intents() { return structuredClone(this.intentLog); }
  get lastTransition() { return this.lastTransitionId; }

  setTag(path: string, value: unknown) { this.tags.set(path, value); this.settle(); }
  getTag(path: string) { return this.tags.get(path); }

  send(event: string) {
    this.perform({ type: event });
    this.settle();
  }

  advance(ms: number) {
    this.nowMs += Math.max(0, ms);
    this.settle();
  }

  reset() {
    this.nowMs = 0;
    this.tags.clear();
    this.intentLog.splice(0);
    this.lastTransitionId = null;
    const initial = initializeStateMachine(this.definition, 0);
    this.instanceValue = initial.instance;
    for (const intent of initial.intents) this.recordIntent(intent);
    this.settle();
  }

  private settle() {
    for (let index = 0; index < 50; index += 1) {
      const changed = this.perform();
      if (!changed) return;
    }
    throw new Error("State machine exceeded 50 automatic transitions; possible transition loop.");
  }

  private perform(event?: { type: string }): boolean {
    const result = stepStateMachine({
      definition: this.definition,
      instance: this.instanceValue,
      ...(event ? { event } : {}),
      values: { readTag: (path) => this.tags.get(path) },
      now: this.nowMs,
    });
    if (!result.transition) return false;
    this.instanceValue = result.instance;
    this.lastTransitionId = result.transition.id;
    for (const intent of result.intents) this.recordIntent(intent);
    return true;
  }

  private recordIntent(intent: StateMachineIntent) {
    this.intentLog.push({ at: this.nowMs, intent });
    if (intent.type === "set-tag") this.tags.set(intent.path, intent.value);
    if (intent.type === "context-updated") this.instanceValue.context[intent.key] = intent.value as MachineValue;
  }
}
