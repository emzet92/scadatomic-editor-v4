export const ALARM_DEFINITION_SCHEMA_VERSION = 1 as const;

export type AlarmPriority = "critical" | "high" | "medium" | "low";

export type AlarmSource = {
  kind: "tag";
  path: string;
};

export type AlarmCondition =
  | { kind: "boolean"; activeWhen: boolean }
  | { kind: "high" | "high-high"; limit: number }
  | { kind: "low" | "low-low"; limit: number }
  | { kind: "equals"; value: string | number | boolean }
  | { kind: "outside-range"; min: number; max: number };

export type AlarmSuppressionRule = {
  source: AlarmSource;
  condition: AlarmCondition;
};

export type AlarmDefinition = {
  schemaVersion: typeof ALARM_DEFINITION_SCHEMA_VERSION;
  id: string;
  projectId: string;
  name: string;
  source: AlarmSource;
  condition: AlarmCondition;
  priority: AlarmPriority;
  enabled: boolean;
  message: string;
  cause?: string | undefined;
  consequence?: string | undefined;
  operatorResponse?: string | undefined;
  deadband: number;
  onDelayMs: number;
  offDelayMs: number;
  ackRequired: boolean;
  latching: boolean;
  suppression?: AlarmSuppressionRule | undefined;
  createdAt: number;
  updatedAt: number;
};

export type AlarmDefinitionSummary = Pick<
  AlarmDefinition,
  "id" | "projectId" | "name" | "source" | "condition" | "priority" | "enabled" | "message" | "updatedAt"
>;

export function createAlarmDefinition(input: {
  projectId: string;
  source: AlarmSource;
  condition: AlarmCondition;
  name?: string | undefined;
  priority?: AlarmPriority | undefined;
  now?: number | undefined;
}): AlarmDefinition {
  const now = input.now ?? Date.now();
  const name = input.name?.trim() || `${input.source.path} alarm`;
  return {
    schemaVersion: ALARM_DEFINITION_SCHEMA_VERSION,
    id: crypto.randomUUID(),
    projectId: input.projectId,
    name,
    source: structuredClone(input.source),
    condition: structuredClone(input.condition),
    priority: input.priority ?? "high",
    enabled: true,
    message: name,
    deadband: 0,
    onDelayMs: 0,
    offDelayMs: 0,
    ackRequired: true,
    latching: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function cloneAlarmDefinition(definition: AlarmDefinition): AlarmDefinition {
  return structuredClone(definition);
}
