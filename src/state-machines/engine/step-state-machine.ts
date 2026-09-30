import type {
  StateMachineAction,
  StateMachineDefinition,
  TransitionDefinition,
} from "../domain/state-machine-definition";
import { createStateMachineInstance, type StateMachineInstance } from "../domain/state-machine-instance";
import type { StateMachineIntent } from "../domain/state-machine-intent";
import { evaluateGuard, type StateMachineValues } from "./evaluate-guard";

export type StateMachineEvent = { type: string; payload?: Record<string, unknown> | undefined };

export type StateMachineStep = {
  instance: StateMachineInstance;
  transition: TransitionDefinition | null;
  intents: StateMachineIntent[];
};


export function initializeStateMachine(definition: StateMachineDefinition, now: number): StateMachineStep {
  const instance = createStateMachineInstance(definition.id, definition.initialStateId, now);
  const state = definition.states[definition.initialStateId];
  if (!state) return { instance, transition: null, intents: [] };
  const intents: StateMachineIntent[] = [];
  for (const action of state.onEnter) applyAction(action, instance, intents);
  return { instance, transition: null, intents };
}

export function stepStateMachine(input: {
  definition: StateMachineDefinition;
  instance: StateMachineInstance;
  event?: StateMachineEvent | undefined;
  values: StateMachineValues;
  now: number;
}): StateMachineStep {
  const { definition, instance, event, values, now } = input;
  const candidates = definition.transitions
    .filter((transition) => transition.from === instance.stateId)
    .filter((transition) => triggerMatches(transition, instance.enteredAt, event, now))
    .filter((transition) => evaluateGuard(transition.guard, instance, values))
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));

  const transition = candidates[0] ?? null;
  if (!transition) return { instance: structuredClone(instance), transition: null, intents: [] };

  const source = definition.states[transition.from];
  const target = definition.states[transition.to];
  if (!source || !target) return { instance: structuredClone(instance), transition: null, intents: [] };

  const next: StateMachineInstance = {
    ...structuredClone(instance),
    stateId: target.id,
    enteredAt: now,
    revision: instance.revision + 1,
  };
  const intents: StateMachineIntent[] = [];
  for (const action of [...source.onExit, ...transition.actions, ...target.onEnter]) {
    applyAction(action, next, intents);
  }
  return { instance: next, transition: structuredClone(transition), intents };
}

function triggerMatches(
  transition: TransitionDefinition,
  enteredAt: number,
  event: StateMachineEvent | undefined,
  now: number,
): boolean {
  switch (transition.trigger.kind) {
    case "event": return event?.type === transition.trigger.event;
    case "condition": return event === undefined;
    case "after": return event === undefined && now - enteredAt >= Math.max(0, transition.trigger.delayMs);
  }
}

function applyAction(action: StateMachineAction, instance: StateMachineInstance, intents: StateMachineIntent[]) {
  switch (action.kind) {
    case "set-tag":
      intents.push({ type: "set-tag", path: action.path, value: action.value });
      return;
    case "emit-event":
      intents.push({ type: "emit-event", event: action.event, ...(action.payload ? { payload: action.payload } : {}) });
      return;
    case "set-context":
      instance.context[action.key] = action.value;
      intents.push({ type: "context-updated", key: action.key, value: action.value });
      return;
  }
}
