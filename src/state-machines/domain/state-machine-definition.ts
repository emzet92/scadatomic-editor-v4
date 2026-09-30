export const STATE_MACHINE_SCHEMA_VERSION = 1 as const;

export type MachineValue = string | number | boolean | null;

export type ValueRef =
  | { kind: "tag"; path: string }
  | { kind: "context"; key: string };

export type ComparisonOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte";

export type GuardExpression =
  | { kind: "literal"; value: boolean }
  | { kind: "compare"; left: ValueRef; operator: ComparisonOperator; right: MachineValue }
  | { kind: "truthy"; value: ValueRef }
  | { kind: "not"; expression: GuardExpression }
  | { kind: "and"; expressions: GuardExpression[] }
  | { kind: "or"; expressions: GuardExpression[] };

export type StateMachineAction =
  | { kind: "set-tag"; path: string; value: MachineValue }
  | { kind: "emit-event"; event: string; payload?: Record<string, MachineValue> | undefined }
  | { kind: "set-context"; key: string; value: MachineValue };

export type TransitionTrigger =
  | { kind: "event"; event: string }
  | { kind: "condition" }
  | { kind: "after"; delayMs: number };

export type StatePosition = { x: number; y: number };

export type StateDefinition = {
  id: string;
  name: string;
  description?: string | undefined;
  position: StatePosition;
  onEnter: StateMachineAction[];
  onExit: StateMachineAction[];
};

export type TransitionDefinition = {
  id: string;
  from: string;
  to: string;
  name?: string | undefined;
  trigger: TransitionTrigger;
  guard?: GuardExpression | undefined;
  actions: StateMachineAction[];
  priority: number;
};

export type StateMachineDefinition = {
  schemaVersion: typeof STATE_MACHINE_SCHEMA_VERSION;
  id: string;
  projectId: string;
  name: string;
  description?: string | undefined;
  initialStateId: string;
  states: Record<string, StateDefinition>;
  transitions: TransitionDefinition[];
  createdAt: number;
  updatedAt: number;
};

export type StateMachineSummary = Pick<StateMachineDefinition, "id" | "projectId" | "name" | "updatedAt">;

export function createStateMachineDefinition(input: {
  id: string;
  projectId: string;
  name: string;
  description?: string | undefined;
  initialStateId: string;
  states: Record<string, StateDefinition>;
  transitions?: TransitionDefinition[] | undefined;
  createdAt?: number | undefined;
}): StateMachineDefinition {
  const now = Date.now();
  return {
    schemaVersion: STATE_MACHINE_SCHEMA_VERSION,
    id: input.id,
    projectId: input.projectId,
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    initialStateId: input.initialStateId,
    states: structuredClone(input.states),
    transitions: structuredClone(input.transitions ?? []),
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  };
}

export function cloneStateMachineDefinition(definition: StateMachineDefinition): StateMachineDefinition {
  return structuredClone(definition);
}

export function validateStateMachineDefinition(definition: StateMachineDefinition): string[] {
  const errors: string[] = [];
  if (!definition.states[definition.initialStateId]) errors.push("Initial state does not exist.");
  for (const transition of definition.transitions) {
    if (!definition.states[transition.from]) errors.push(`Transition ${transition.id} has unknown source state ${transition.from}.`);
    if (!definition.states[transition.to]) errors.push(`Transition ${transition.id} has unknown target state ${transition.to}.`);
  }
  return errors;
}
