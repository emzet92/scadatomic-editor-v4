import type { MachineValue } from "../domain/state-machine-definition";

export interface StateMachineValueSource {
  read(path: string): unknown;
  subscribe(path: string, listener: () => void): () => void;
}

export interface StateMachineEffectSink {
  setTag(path: string, value: MachineValue): void | Promise<void>;
  emitEvent(event: string, payload?: Record<string, MachineValue> | undefined): void | Promise<void>;
}

export interface StateMachineClock { now(): number; }
export interface StateMachineScheduler { every(intervalMs: number, listener: () => void): () => void; }
