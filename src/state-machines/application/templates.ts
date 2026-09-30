import { action, defineStateMachine, guard, state, transition, trigger } from "./js-api";

export function createSimpleMachineTemplate(projectId: string, id: string) {
  return defineStateMachine({
    id,
    projectId,
    name: "Simple machine",
    initial: "idle",
    states: [
      state("idle", { name: "IDLE", x: 80, y: 180 }),
      state("starting", { name: "STARTING", x: 360, y: 80, onEnter: [action.setTag("Machine.Command", "START")] }),
      state("running", { name: "RUNNING", x: 650, y: 180 }),
      state("fault", { name: "FAULT", x: 360, y: 350, onEnter: [action.setTag("Machine.Command", "STOP")] }),
    ],
    transitions: [
      transition("idle-starting", "idle", "starting", {
        name: "Start",
        trigger: trigger.event("START"),
        guard: guard.tag("Safety.Ok").eq(true),
      }),
      transition("starting-running", "starting", "running", {
        trigger: trigger.condition(),
        guard: guard.tag("Motor.Running").eq(true),
      }),
      transition("starting-fault", "starting", "fault", {
        name: "Start timeout",
        trigger: trigger.after(5000),
      }),
      transition("running-idle", "running", "idle", { trigger: trigger.event("STOP") }),
      transition("running-fault", "running", "fault", {
        trigger: trigger.condition(),
        guard: guard.tag("Machine.Fault").eq(true),
        priority: 10,
      }),
      transition("fault-idle", "fault", "idle", { trigger: trigger.event("RESET") }),
    ],
  });
}

export function createPackMlStarterTemplate(projectId: string, id: string) {
  const stateIds = ["stopped", "starting", "idle", "execute", "completing", "complete", "stopping", "aborting", "aborted"];
  const names = ["STOPPED", "STARTING", "IDLE", "EXECUTE", "COMPLETING", "COMPLETE", "STOPPING", "ABORTING", "ABORTED"];
  return defineStateMachine({
    id,
    projectId,
    name: "PackML starter",
    initial: "stopped",
    states: stateIds.map((stateId, index) => state(stateId, {
      name: names[index] ?? stateId.toUpperCase(),
      x: 80 + (index % 5) * 240,
      y: 100 + Math.floor(index / 5) * 250,
    })),
    transitions: [
      transition("stopped-starting", "stopped", "starting", { trigger: trigger.event("START") }),
      transition("starting-idle", "starting", "idle", { trigger: trigger.condition(), guard: guard.tag("Machine.Ready").eq(true) }),
      transition("idle-execute", "idle", "execute", { trigger: trigger.event("EXECUTE") }),
      transition("execute-completing", "execute", "completing", { trigger: trigger.event("COMPLETE") }),
      transition("completing-complete", "completing", "complete", { trigger: trigger.condition(), guard: guard.tag("Machine.Complete").eq(true) }),
      transition("complete-stopped", "complete", "stopped", { trigger: trigger.event("RESET") }),
      transition("execute-stopping", "execute", "stopping", { trigger: trigger.event("STOP") }),
      transition("stopping-stopped", "stopping", "stopped", { trigger: trigger.condition(), guard: guard.tag("Machine.Stopped").eq(true) }),
      transition("execute-aborting", "execute", "aborting", { trigger: trigger.event("ABORT"), priority: 100 }),
      transition("aborting-aborted", "aborting", "aborted", { trigger: trigger.condition(), guard: guard.tag("Machine.Aborted").eq(true) }),
      transition("aborted-stopped", "aborted", "stopped", { trigger: trigger.event("CLEAR") }),
    ],
  });
}
