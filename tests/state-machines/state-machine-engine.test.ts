import test from "node:test";
import assert from "node:assert/strict";
import { action, defineStateMachine, guard, state, transition, trigger } from "../../src/state-machines/application/js-api";
import { createStateMachineInstance } from "../../src/state-machines/domain/state-machine-instance";
import { stepStateMachine } from "../../src/state-machines/engine/step-state-machine";
import { StateMachineSimulationSession } from "../../src/state-machines/simulation/StateMachineSimulationSession";

function definition() {
  return defineStateMachine({
    id: "machine-1",
    projectId: "demo",
    name: "Test",
    initial: "idle",
    states: [
      state("idle", { onExit: [action.setContext("leftIdle", true)] }),
      state("starting", { onEnter: [action.setTag("Motor.Command", true)] }),
      state("running"),
      state("fault"),
    ],
    transitions: [
      transition("start", "idle", "starting", { trigger: trigger.event("START"), guard: guard.tag("Safety.Ok").eq(true) }),
      transition("running", "starting", "running", { trigger: trigger.condition(), guard: guard.tag("Motor.Running").eq(true) }),
      transition("timeout", "starting", "fault", { trigger: trigger.after(5000) }),
    ],
  });
}

test("event transition respects guard and emits deterministic intents", () => {
  const machine = definition();
  const instance = createStateMachineInstance(machine.id, machine.initialStateId, 0);
  const values = new Map<string, unknown>([["Safety.Ok", true]]);
  const result = stepStateMachine({ definition: machine, instance, event: { type: "START" }, values: { readTag: (path) => values.get(path) }, now: 100 });
  assert.equal(result.instance.stateId, "starting");
  assert.deepEqual(result.intents, [
    { type: "context-updated", key: "leftIdle", value: true },
    { type: "set-tag", path: "Motor.Command", value: true },
  ]);
});

test("blocked guard leaves machine in current state", () => {
  const machine = definition();
  const instance = createStateMachineInstance(machine.id, machine.initialStateId, 0);
  const result = stepStateMachine({ definition: machine, instance, event: { type: "START" }, values: { readTag: () => false }, now: 100 });
  assert.equal(result.transition, null);
  assert.equal(result.instance.stateId, "idle");
});

test("condition transition reacts to sandbox tag", () => {
  const session = new StateMachineSimulationSession(definition());
  session.setTag("Safety.Ok", true);
  session.send("START");
  assert.equal(session.instance.stateId, "starting");
  session.setTag("Motor.Running", true);
  assert.equal(session.instance.stateId, "running");
});

test("virtual time triggers timeout without real timers", () => {
  const session = new StateMachineSimulationSession(definition());
  session.setTag("Safety.Ok", true);
  session.send("START");
  session.advance(4999);
  assert.equal(session.instance.stateId, "starting");
  session.advance(1);
  assert.equal(session.instance.stateId, "fault");
});

test("higher priority automatic transition wins", () => {
  const machine = definition();
  machine.transitions.push(
    transition("fast-fault", "starting", "fault", { trigger: trigger.condition(), guard: guard.tag("Emergency").eq(true), priority: 100 }),
  );
  const starting = createStateMachineInstance(machine.id, "starting", 0);
  const values = new Map<string, unknown>([["Motor.Running", true], ["Emergency", true]]);
  const result = stepStateMachine({ definition: machine, instance: starting, values: { readTag: (path) => values.get(path) }, now: 1 });
  assert.equal(result.transition?.id, "fast-fault");
  assert.equal(result.instance.stateId, "fault");
});
