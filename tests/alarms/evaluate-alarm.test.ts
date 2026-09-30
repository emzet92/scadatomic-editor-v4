import assert from "node:assert/strict";
import { test } from "node:test";
import { createAlarmDefinition } from "../../src/alarms/domain/alarm-definition";
import { createAlarmInstance } from "../../src/alarms/domain/alarm-instance";
import { acknowledgeAlarm, evaluateAlarm, shelveAlarm, unshelveAlarm } from "../../src/alarms/engine/evaluate-alarm";

function highAlarm() {
  return createAlarmDefinition({
    projectId: "demo",
    source: { kind: "tag", path: "Tank.Level" },
    condition: { kind: "high", limit: 95 },
    now: 0,
  });
}

test("high alarm respects on-delay and deadband", () => {
  const definition = { ...highAlarm(), deadband: 2, onDelayMs: 1000 };
  let instance = createAlarmInstance(definition.id, definition.projectId, 0);

  let result = evaluateAlarm({ definition, previous: instance, value: 96, now: 0 });
  assert.equal(result.instance.active, false);
  assert.equal(result.instance.pendingActiveSince, 0);

  result = evaluateAlarm({ definition, previous: result.instance, value: 96, now: 1000 });
  assert.equal(result.instance.active, true);
  assert.equal(result.events[0]?.type, "activated");

  result = evaluateAlarm({ definition, previous: result.instance, value: 94, now: 1100 });
  assert.equal(result.instance.conditionActive, true, "deadband keeps the alarm condition active");

  result = evaluateAlarm({ definition, previous: result.instance, value: 92, now: 1200 });
  assert.equal(result.instance.active, false);
  assert.equal(result.events[0]?.type, "returned-to-normal");
});

test("returned-to-normal alarm remains unacknowledged until ACK", () => {
  const definition = highAlarm();
  let instance = createAlarmInstance(definition.id, definition.projectId, 0);
  let result = evaluateAlarm({ definition, previous: instance, value: 100, now: 0 });
  assert.equal(result.instance.active, true);
  assert.equal(result.instance.acknowledged, false);

  result = evaluateAlarm({ definition, previous: result.instance, value: 0, now: 10 });
  assert.equal(result.instance.active, false);
  assert.equal(result.instance.acknowledged, false);

  const ack = acknowledgeAlarm(definition, result.instance, 20, "operator-a");
  assert.equal(ack.instance.acknowledged, true);
  assert.equal(ack.events[0]?.actor, "operator-a");
});

test("latching alarm clears on ACK only after the condition returned to normal", () => {
  const definition = { ...highAlarm(), latching: true };
  let result = evaluateAlarm({ definition, value: 100, now: 0 });
  assert.equal(result.instance.active, true);

  result = evaluateAlarm({ definition, previous: result.instance, value: 0, now: 10 });
  assert.equal(result.instance.conditionActive, false);
  assert.equal(result.instance.active, true);

  const ack = acknowledgeAlarm(definition, result.instance, 20);
  assert.equal(ack.instance.active, false);
});

test("shelving does not mutate the alarm condition", () => {
  const definition = highAlarm();
  const active = evaluateAlarm({ definition, value: 100, now: 0 }).instance;
  const shelved = shelveAlarm(definition, active, 10, 60_000);
  assert.equal(shelved.instance.active, true);
  assert.equal(shelved.instance.shelvedUntil, 60_010);
  const unshelved = unshelveAlarm(definition, shelved.instance, 20);
  assert.equal(unshelved.instance.shelvedUntil, undefined);
  assert.equal(unshelved.instance.active, true);
});

test("suppression blocks activation but preserves condition evaluation inputs", () => {
  const definition = {
    ...highAlarm(),
    suppression: {
      source: { kind: "tag" as const, path: "Machine.Stopped" },
      condition: { kind: "boolean" as const, activeWhen: true },
    },
  };
  const suppressed = evaluateAlarm({ definition, value: 100, suppressionValue: true, now: 0 });
  assert.equal(suppressed.instance.suppressed, true);
  assert.equal(suppressed.instance.active, false);
  assert.equal(suppressed.events[0]?.type, "suppressed");

  const eligible = evaluateAlarm({ definition, previous: suppressed.instance, value: 100, suppressionValue: false, now: 1 });
  assert.equal(eligible.instance.suppressed, false);
  assert.equal(eligible.instance.active, true);
  assert.deepEqual(eligible.events.map((event) => event.type), ["unsuppressed", "activated"]);
});
