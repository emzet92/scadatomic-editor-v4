import type { AlarmCondition, AlarmDefinition } from "../domain/alarm-definition";
import type { AlarmEvent, AlarmEventType } from "../domain/alarm-event";
import { createAlarmInstance, type AlarmInstance } from "../domain/alarm-instance";

export type AlarmEvaluation = {
  instance: AlarmInstance;
  events: AlarmEvent[];
};

export function evaluateAlarm(input: {
  definition: AlarmDefinition;
  previous?: AlarmInstance | null | undefined;
  value: unknown;
  suppressionValue?: unknown;
  now: number;
}): AlarmEvaluation {
  const { definition, value, now } = input;
  let next = structuredClone(input.previous ?? createAlarmInstance(definition.id, definition.projectId, now));
  const events: AlarmEvent[] = [];

  const suppressed = definition.suppression
    ? evaluateCondition(definition.suppression.condition, input.suppressionValue, next.suppressed, 0)
    : false;
  if (suppressed !== next.suppressed) {
    next.suppressed = suppressed;
    events.push(makeEvent(definition, suppressed ? "suppressed" : "unsuppressed", now, value));
  }

  next.lastValue = value;
  if (!definition.enabled || suppressed) {
    next.pendingActiveSince = undefined;
    next.pendingNormalSince = undefined;
    next.updatedAt = now;
    return { instance: next, events };
  }

  const requestedCondition = evaluateCondition(definition.condition, value, next.conditionActive, definition.deadband);

  if (requestedCondition && !next.conditionActive) {
    const since = next.pendingActiveSince ?? now;
    next.pendingActiveSince = since;
    next.pendingNormalSince = undefined;
    if (now - since >= definition.onDelayMs) {
      next.conditionActive = true;
      next.pendingActiveSince = undefined;
      next.returnedToNormalAt = undefined;
      if (!next.active) {
        next.active = true;
        next.activeSince = now;
        next.acknowledged = !definition.ackRequired;
        next.acknowledgedAt = definition.ackRequired ? undefined : now;
        events.push(makeEvent(definition, "activated", now, value));
      }
    }
  } else if (!requestedCondition && next.conditionActive) {
    const since = next.pendingNormalSince ?? now;
    next.pendingNormalSince = since;
    next.pendingActiveSince = undefined;
    if (now - since >= definition.offDelayMs) {
      next.conditionActive = false;
      next.pendingNormalSince = undefined;
      next.returnedToNormalAt = now;
      events.push(makeEvent(definition, "returned-to-normal", now, value));
      if (!definition.latching) {
        next.active = false;
        next.activeSince = undefined;
      }
    }
  } else {
    next.pendingActiveSince = undefined;
    next.pendingNormalSince = undefined;
  }

  next.updatedAt = now;
  return { instance: next, events };
}

export function acknowledgeAlarm(definition: AlarmDefinition, previous: AlarmInstance, now: number, actor?: string): AlarmEvaluation {
  const next = structuredClone(previous);
  const events: AlarmEvent[] = [];
  if (!next.acknowledged) {
    next.acknowledged = true;
    next.acknowledgedAt = now;
    events.push(makeEvent(definition, "acknowledged", now, next.lastValue, actor));
  }
  if (definition.latching && !next.conditionActive) {
    next.active = false;
    next.activeSince = undefined;
  }
  next.updatedAt = now;
  return { instance: next, events };
}

export function shelveAlarm(definition: AlarmDefinition, previous: AlarmInstance, now: number, durationMs: number, actor?: string): AlarmEvaluation {
  const next = { ...structuredClone(previous), shelvedUntil: now + Math.max(0, durationMs), updatedAt: now };
  return { instance: next, events: [makeEvent(definition, "shelved", now, next.lastValue, actor, { durationMs })] };
}

export function unshelveAlarm(definition: AlarmDefinition, previous: AlarmInstance, now: number, actor?: string): AlarmEvaluation {
  if (previous.shelvedUntil === undefined) return { instance: previous, events: [] };
  const next = { ...structuredClone(previous), shelvedUntil: undefined, updatedAt: now };
  return { instance: next, events: [makeEvent(definition, "unshelved", now, next.lastValue, actor)] };
}

export function evaluateCondition(condition: AlarmCondition, value: unknown, currentlyActive: boolean, deadband: number): boolean {
  switch (condition.kind) {
    case "boolean":
      return typeof value === "boolean" && value === condition.activeWhen;
    case "equals":
      return Object.is(value, condition.value);
    case "high":
    case "high-high": {
      if (typeof value !== "number" || !Number.isFinite(value)) return false;
      return currentlyActive ? value > condition.limit - Math.max(0, deadband) : value > condition.limit;
    }
    case "low":
    case "low-low": {
      if (typeof value !== "number" || !Number.isFinite(value)) return false;
      return currentlyActive ? value < condition.limit + Math.max(0, deadband) : value < condition.limit;
    }
    case "outside-range": {
      if (typeof value !== "number" || !Number.isFinite(value)) return false;
      if (!currentlyActive) return value < condition.min || value > condition.max;
      const db = Math.max(0, deadband);
      return value < condition.min + db || value > condition.max - db;
    }
  }
}

function makeEvent(
  definition: AlarmDefinition,
  type: AlarmEventType,
  timestamp: number,
  value?: unknown,
  actor?: string,
  metadata?: Record<string, unknown>,
): AlarmEvent {
  return {
    id: crypto.randomUUID(),
    projectId: definition.projectId,
    alarmId: definition.id,
    type,
    timestamp,
    priority: definition.priority,
    sourcePath: definition.source.path,
    message: definition.message,
    ...(value !== undefined ? { value } : {}),
    ...(actor ? { actor } : {}),
    ...(metadata ? { metadata } : {}),
  };
}
