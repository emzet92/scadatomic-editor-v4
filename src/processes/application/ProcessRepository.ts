import type { ProcessDefinition, ProcessSummary } from "../domain/process-definition";

/** Persistence port. Domain/application code does not know about IndexedDB. */
export interface ProcessRepository {
  list(projectId: string): Promise<ProcessSummary[]>;
  get(processId: string): Promise<ProcessDefinition | null>;
  put(definition: ProcessDefinition): Promise<void>;
  delete(processId: string): Promise<void>;
}
