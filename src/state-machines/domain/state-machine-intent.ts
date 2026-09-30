import type { MachineValue } from "./state-machine-definition";

export type StateMachineIntent =
  | { type: "set-tag"; path: string; value: MachineValue }
  | { type: "emit-event"; event: string; payload?: Record<string, MachineValue> | undefined }
  | { type: "context-updated"; key: string; value: MachineValue };
