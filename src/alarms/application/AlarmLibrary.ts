import type { AlarmChangeBus, AlarmLibraryEvent } from "./AlarmChangeBus";
import type { AlarmDefinitionRepository, AlarmEventRepository, AlarmStateRepository } from "./AlarmPorts";
import type { AlarmDefinition, AlarmDefinitionSummary } from "../domain/alarm-definition";
import { cloneAlarmDefinition } from "../domain/alarm-definition";
import type { AlarmEvent } from "../domain/alarm-event";
import type { AlarmInstance } from "../domain/alarm-instance";

export class AlarmLibrary {
  private readonly definitions: AlarmDefinitionRepository;
  private readonly events: AlarmEventRepository;
  private readonly states: AlarmStateRepository;
  private readonly changeBus: AlarmChangeBus | null;
  private readonly listeners = new Set<(event: AlarmLibraryEvent) => void>();
  private readonly unsubscribeBus: (() => void) | null;

  constructor(
    definitions: AlarmDefinitionRepository,
    events: AlarmEventRepository,
    states: AlarmStateRepository,
    changeBus: AlarmChangeBus | null = null,
  ) {
    this.definitions = definitions;
    this.events = events;
    this.states = states;
    this.changeBus = changeBus;
    this.unsubscribeBus = changeBus?.subscribe((event) => this.emit(event)) ?? null;
  }

  list(projectId: string): Promise<AlarmDefinitionSummary[]> {
    return this.definitions.list(projectId);
  }

  async get(alarmId: string): Promise<AlarmDefinition | null> {
    const definition = await this.definitions.get(alarmId);
    return definition ? cloneAlarmDefinition(definition) : null;
  }

  async save(definition: AlarmDefinition): Promise<AlarmDefinition> {
    const next = { ...cloneAlarmDefinition(definition), updatedAt: Date.now() };
    await this.definitions.put(next);
    this.publish({ projectId: next.projectId, alarmId: next.id, kind: "saved", updatedAt: next.updatedAt });
    return cloneAlarmDefinition(next);
  }

  async delete(definition: Pick<AlarmDefinition, "id" | "projectId">): Promise<void> {
    await this.definitions.delete(definition.id);
    await this.states.deleteState(definition.projectId, definition.id);
    this.publish({ projectId: definition.projectId, alarmId: definition.id, kind: "deleted", updatedAt: Date.now() });
  }

  listEvents(projectId: string, options?: { alarmId?: string | undefined; limit?: number | undefined }): Promise<AlarmEvent[]> {
    return this.events.listEvents(projectId, options);
  }

  async appendEvent(event: AlarmEvent): Promise<void> {
    await this.events.append(structuredClone(event));
    this.publish({ projectId: event.projectId, alarmId: event.alarmId, kind: "event", updatedAt: event.timestamp });
  }

  getState(projectId: string, alarmId: string): Promise<AlarmInstance | null> {
    return this.states.getState(projectId, alarmId);
  }

  async saveState(instance: AlarmInstance): Promise<void> {
    await this.states.putState(structuredClone(instance));
    this.publish({ projectId: instance.projectId, alarmId: instance.alarmId, kind: "state", updatedAt: instance.updatedAt });
  }

  subscribe(listener: (event: AlarmLibraryEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispose(): void {
    this.unsubscribeBus?.();
    this.changeBus?.dispose();
    this.listeners.clear();
  }

  private publish(event: AlarmLibraryEvent) {
    this.emit(event);
    this.changeBus?.publish(event);
  }

  private emit(event: AlarmLibraryEvent) {
    for (const listener of this.listeners) listener(event);
  }
}
