import type { ProcessDefinition, ProcessSummary } from "../domain/process-definition";
import { cloneProcessDefinition } from "../domain/process-definition";
import type { ProcessChangeBus, ProcessLibraryEvent } from "./ProcessChangeBus";
import type { ProcessRepository } from "./ProcessRepository";

/**
 * Application service around process persistence. It is the only API UI code
 * uses for saved processes. IndexedDB stays authoritative; change-bus events
 * only invalidate readers in this tab or another runtime/designer tab.
 */
export class ProcessLibrary {
  private readonly repository: ProcessRepository;
  private readonly changeBus: ProcessChangeBus | null;
  private readonly listeners = new Set<(event: ProcessLibraryEvent) => void>();
  private readonly unsubscribeChangeBus: (() => void) | null;

  constructor(repository: ProcessRepository, changeBus?: ProcessChangeBus) {
    this.repository = repository;
    this.changeBus = changeBus ?? null;
    this.unsubscribeChangeBus = this.changeBus?.subscribe((event) => this.emit(event)) ?? null;
  }

  list(projectId: string): Promise<ProcessSummary[]> {
    return this.repository.list(projectId);
  }

  async get(processId: string): Promise<ProcessDefinition | null> {
    const value = await this.repository.get(processId);
    return value ? cloneProcessDefinition(value) : null;
  }

  async getLatest(projectId: string): Promise<ProcessDefinition | null> {
    const [latest] = await this.repository.list(projectId);
    return latest ? this.get(latest.id) : null;
  }

  async save(definition: ProcessDefinition): Promise<ProcessDefinition> {
    const next: ProcessDefinition = {
      ...cloneProcessDefinition(definition),
      updatedAt: Date.now(),
    };
    await this.repository.put(next);

    const event: ProcessLibraryEvent = {
      projectId: next.projectId,
      processId: next.id,
      kind: "saved",
      updatedAt: next.updatedAt,
    };
    this.emit(event);
    this.changeBus?.publish(event);
    return cloneProcessDefinition(next);
  }

  async delete(definition: Pick<ProcessDefinition, "id" | "projectId">): Promise<void> {
    await this.repository.delete(definition.id);
    const event: ProcessLibraryEvent = {
      projectId: definition.projectId,
      processId: definition.id,
      kind: "deleted",
      updatedAt: Date.now(),
    };
    this.emit(event);
    this.changeBus?.publish(event);
  }

  subscribe(listener: (event: ProcessLibraryEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispose(): void {
    this.unsubscribeChangeBus?.();
    this.changeBus?.dispose();
    this.listeners.clear();
  }

  private emit(event: ProcessLibraryEvent) {
    for (const listener of this.listeners) listener(event);
  }
}

export type { ProcessLibraryEvent } from "./ProcessChangeBus";
