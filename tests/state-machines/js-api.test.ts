import test from "node:test";
import assert from "node:assert/strict";
import { action, defineStateMachine, guard, state, transition, trigger } from "../../src/state-machines/application/js-api";

test("JS API produces serializable AST", () => {
  const definition = defineStateMachine({
    id: "m",
    projectId: "p",
    name: "Machine",
    initial: "idle",
    states: [state("idle"), state("run")],
    transitions: [transition("t", "idle", "run", {
      trigger: trigger.event("START"),
      guard: guard.and(guard.tag("Safety.Ok").eq(true), guard.context("ready").eq(true)),
      actions: [action.setTag("Motor.Command", true), action.emit("started")],
    })],
  });
  assert.doesNotThrow(() => JSON.stringify(definition));
  assert.equal(definition.transitions[0]?.trigger.kind, "event");
  assert.equal(definition.transitions[0]?.actions.length, 2);
});
