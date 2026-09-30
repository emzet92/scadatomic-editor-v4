import { cloneStateMachineDefinition, type StateMachineDefinition } from "../domain/state-machine-definition";
import type { StateMachineChangeBus, StateMachineLibraryEvent } from "./StateMachineChangeBus";
import type { StateMachineRepository } from "./StateMachineRepository";

export class StateMachineLibrary {
  private readonly repository: StateMachineRepository;
  private readonly bus: StateMachineChangeBus | null;
  private readonly listeners = new Set<(event: StateMachineLibraryEvent) => void>();
  private readonly unsubscribeBus: (() => void) | null;

  constructor(repository: StateMachineRepository, bus: StateMachineChangeBus | null = null) {
    this.repository = repository;
    this.bus = bus;
    this.unsubscribeBus = bus?.subscribe((event) => this.emit(event)) ?? null;
  }

  list(projectId: string) { return this.repository.list(projectId); }

  async get(machineId: string) {
    const value = await this.repository.get(machineId);
    return value ? cloneStateMachineDefinition(value) : null;
  }

  async save(definition: StateMachineDefinition): Promise<StateMachineDefinition> {
    const next = { ...cloneStateMachineDefinition(definition), updatedAt: Date.now() };
    await this.repository.put(next);
    const event: StateMachineLibraryEvent = {
      projectId: next.projectId,
      machineId: next.id,
      kind: "saved",
      updatedAt: next.updatedAt,
    };
    this.emit(event);
    this.bus?.publish(event);
    return cloneStateMachineDefinition(next);
  }

  async delete(definition: Pick<StateMachineDefinition, "id" | "projectId">) {
    await this.repository.delete(definition.id);
    const event: StateMachineLibraryEvent = {
      projectId: definition.projectId,
      machineId: definition.id,
      kind: "deleted",
      updatedAt: Date.now(),
    };
    this.emit(event);
    this.bus?.publish(event);
  }

  subscribe(listener: (event: StateMachineLibraryEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispose() {
    this.unsubscribeBus?.();
    this.bus?.dispose();
    this.listeners.clear();
  }

  private emit(event: StateMachineLibraryEvent) {
    for (const listener of this.listeners) listener(event);
  }
}
