import type { MachineValue } from "./state-machine-definition";

export type StateMachineInstance = {
  machineId: string;
  stateId: string;
  enteredAt: number;
  context: Record<string, MachineValue>;
  revision: number;
};

export function createStateMachineInstance(machineId: string, stateId: string, now: number): StateMachineInstance {
  return {
    machineId,
    stateId,
    enteredAt: now,
    context: {},
    revision: 0,
  };
}
