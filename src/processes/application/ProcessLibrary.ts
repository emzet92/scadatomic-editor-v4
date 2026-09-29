import type { ProcessDefinition, ProcessSummary } from "../domain/process-definition";
import { cloneProcessDefinition } from "../domain/process-definition";
import type { ProcessRepository } from "./ProcessRepository";

export type ProcessLibraryEvent = {
  projectId: string;
  processId: string;
  kind: "saved" | "deleted";
};

/**
 * Application service around persistence. It is the only API React/designer
 * code uses for saved processes and supplies same-tab change notifications.
 */
export class ProcessLibrary {
  private readonly repository: ProcessRepository;
  private readonly listeners = new Set<(event: ProcessLibraryEvent) => void>();

  constructor(repository: ProcessRepository) {
    this.repository = repository;
  }

  list(projectId: string): Promise<ProcessSummary[]> {
    return this.repository.list(projectId);
  }

  async get(processId: string): Promise<ProcessDefinition | null> {
    const value = await this.repository.get(processId);
    return value ? cloneProcessDefinition(value) : null;
  }

  async save(definition: ProcessDefinition): Promise<void> {
    const next: ProcessDefinition = {
      ...cloneProcessDefinition(definition),
      updatedAt: Date.now(),
    };
    await this.repository.put(next);
    this.emit({ projectId: next.projectId, processId: next.id, kind: "saved" });
  }

  async delete(definition: Pick<ProcessDefinition, "id" | "projectId">): Promise<void> {
    await this.repository.delete(definition.id);
    this.emit({ projectId: definition.projectId, processId: definition.id, kind: "deleted" });
  }

  subscribe(listener: (event: ProcessLibraryEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: ProcessLibraryEvent) {
    for (const listener of this.listeners) listener(event);
  }
}
