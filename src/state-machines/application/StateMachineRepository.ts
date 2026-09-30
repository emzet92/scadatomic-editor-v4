import type { StateMachineDefinition, StateMachineSummary } from "../domain/state-machine-definition";

export interface StateMachineRepository {
  list(projectId: string): Promise<StateMachineSummary[]>;
  get(machineId: string): Promise<StateMachineDefinition | null>;
  put(definition: StateMachineDefinition): Promise<void>;
  delete(machineId: string): Promise<void>;
}
