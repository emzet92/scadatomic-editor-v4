import type { AlarmDefinition } from "../domain/alarm-definition";
import type { AlarmEvent } from "../domain/alarm-event";
import { createAlarmInstance, type AlarmInstance } from "../domain/alarm-instance";
import { acknowledgeAlarm, evaluateAlarm } from "../engine/evaluate-alarm";

export class AlarmTestSession {
  private definition: AlarmDefinition;
  private nowMs = 0;
  private value: unknown;
  private suppressionValue: unknown;
  private instance: AlarmInstance;
  private readonly events: AlarmEvent[] = [];

  constructor(definition: AlarmDefinition) {
    this.definition = structuredClone(definition);
    this.instance = createAlarmInstance(definition.id, definition.projectId, 0);
  }

  setDefinition(definition: AlarmDefinition) { this.definition = structuredClone(definition); this.reset(); }
  setValue(value: unknown) { this.value = value; this.evaluate(); }
  setSuppressionValue(value: unknown) { this.suppressionValue = value; this.evaluate(); }
  advanceBy(ms: number) { this.nowMs += Math.max(0, ms); this.evaluate(); }
  acknowledge() { this.commit(acknowledgeAlarm(this.definition, this.instance, this.nowMs, "test-operator")); }
  reset() { this.nowMs = 0; this.value = undefined; this.suppressionValue = undefined; this.instance = createAlarmInstance(this.definition.id, this.definition.projectId, 0); this.events.splice(0); }
  snapshot() { return { now: this.nowMs, value: this.value, instance: structuredClone(this.instance), events: structuredClone(this.events) }; }

  private evaluate() {
    this.commit(evaluateAlarm({ definition: this.definition, previous: this.instance, value: this.value, ...(this.definition.suppression ? { suppressionValue: this.suppressionValue } : {}), now: this.nowMs }));
  }
  private commit(result: ReturnType<typeof evaluateAlarm>) { this.instance = result.instance; this.events.push(...result.events); }
}
