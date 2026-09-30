import {
  STATE_MACHINE_SCHEMA_VERSION,
  type GuardExpression,
  type MachineValue,
  type StateDefinition,
  type StateMachineAction,
  type StateMachineDefinition,
  type TransitionDefinition,
  type TransitionTrigger,
  type ValueRef,
} from "../domain/state-machine-definition";

class ValueExpressionBuilder {
  private readonly ref: ValueRef;
  constructor(ref: ValueRef) { this.ref = ref; }
  eq(value: MachineValue): GuardExpression { return { kind: "compare", left: this.ref, operator: "eq", right: value }; }
  neq(value: MachineValue): GuardExpression { return { kind: "compare", left: this.ref, operator: "neq", right: value }; }
  gt(value: MachineValue): GuardExpression { return { kind: "compare", left: this.ref, operator: "gt", right: value }; }
  gte(value: MachineValue): GuardExpression { return { kind: "compare", left: this.ref, operator: "gte", right: value }; }
  lt(value: MachineValue): GuardExpression { return { kind: "compare", left: this.ref, operator: "lt", right: value }; }
  lte(value: MachineValue): GuardExpression { return { kind: "compare", left: this.ref, operator: "lte", right: value }; }
  truthy(): GuardExpression { return { kind: "truthy", value: this.ref }; }
}

export const guard = Object.freeze({
  tag(path: string) { return new ValueExpressionBuilder({ kind: "tag", path }); },
  context(key: string) { return new ValueExpressionBuilder({ kind: "context", key }); },
  and(...expressions: GuardExpression[]): GuardExpression { return { kind: "and", expressions }; },
  or(...expressions: GuardExpression[]): GuardExpression { return { kind: "or", expressions }; },
  not(expression: GuardExpression): GuardExpression { return { kind: "not", expression }; },
  always(): GuardExpression { return { kind: "literal", value: true }; },
});

export const action = Object.freeze({
  setTag(path: string, value: MachineValue): StateMachineAction { return { kind: "set-tag", path, value }; },
  emit(event: string, payload?: Record<string, MachineValue>): StateMachineAction {
    return { kind: "emit-event", event, ...(payload ? { payload } : {}) };
  },
  setContext(key: string, value: MachineValue): StateMachineAction { return { kind: "set-context", key, value }; },
});

export const trigger = Object.freeze({
  event(event: string): TransitionTrigger { return { kind: "event", event }; },
  condition(): TransitionTrigger { return { kind: "condition" }; },
  after(ms: number): TransitionTrigger { return { kind: "after", delayMs: ms }; },
});

export function state(
  id: string,
  options: {
    name?: string;
    description?: string;
    x?: number;
    y?: number;
    onEnter?: StateMachineAction[];
    onExit?: StateMachineAction[];
  } = {},
): StateDefinition {
  return {
    id,
    name: options.name ?? id,
    ...(options.description ? { description: options.description } : {}),
    position: { x: options.x ?? 0, y: options.y ?? 0 },
    onEnter: structuredClone(options.onEnter ?? []),
    onExit: structuredClone(options.onExit ?? []),
  };
}

export function transition(
  id: string,
  from: string,
  to: string,
  options: {
    trigger?: TransitionTrigger;
    guard?: GuardExpression;
    actions?: StateMachineAction[];
    name?: string;
    priority?: number;
  } = {},
): TransitionDefinition {
  return {
    id,
    from,
    to,
    ...(options.name ? { name: options.name } : {}),
    trigger: options.trigger ?? trigger.condition(),
    ...(options.guard ? { guard: structuredClone(options.guard) } : {}),
    actions: structuredClone(options.actions ?? []),
    priority: options.priority ?? 0,
  };
}

export function defineStateMachine(input: {
  id: string;
  projectId: string;
  name: string;
  initial: string;
  states: StateDefinition[];
  transitions?: TransitionDefinition[];
  description?: string;
  createdAt?: number;
}): StateMachineDefinition {
  const now = Date.now();
  return {
    schemaVersion: STATE_MACHINE_SCHEMA_VERSION,
    id: input.id,
    projectId: input.projectId,
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    initialStateId: input.initial,
    states: Object.fromEntries(input.states.map((item) => [item.id, structuredClone(item)])),
    transitions: structuredClone(input.transitions ?? []),
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  };
}

/** Public JavaScript DSL. The visual editor persists exactly the same AST. */
export const stateMachines = Object.freeze({
  define: defineStateMachine,
  state,
  transition,
  trigger,
  guard,
  action,
});
