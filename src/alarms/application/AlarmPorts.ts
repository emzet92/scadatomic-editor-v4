import type { AlarmDefinition, AlarmDefinitionSummary } from "../domain/alarm-definition";
import type { AlarmEvent } from "../domain/alarm-event";
import type { AlarmInstance } from "../domain/alarm-instance";

export interface AlarmDefinitionRepository {
  list(projectId: string): Promise<AlarmDefinitionSummary[]>;
  get(alarmId: string): Promise<AlarmDefinition | null>;
  put(definition: AlarmDefinition): Promise<void>;
  delete(alarmId: string): Promise<void>;
}

export interface AlarmEventRepository {
  append(event: AlarmEvent): Promise<void>;
  listEvents(projectId: string, options?: { alarmId?: string | undefined; limit?: number | undefined }): Promise<AlarmEvent[]>;
}

export interface AlarmStateRepository {
  getState(projectId: string, alarmId: string): Promise<AlarmInstance | null>;
  putState(instance: AlarmInstance): Promise<void>;
  deleteState(projectId: string, alarmId: string): Promise<void>;
}

export interface AlarmValueSource {
  read(path: string): unknown;
  subscribe(path: string, listener: () => void): () => void;
}

export interface Clock {
  now(): number;
}

export interface AlarmScheduler {
  every(intervalMs: number, listener: () => void): () => void;
}
