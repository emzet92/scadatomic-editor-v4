import type { AlarmDefinition, AlarmDefinitionSummary } from "../domain/alarm-definition";
import { ALARM_DEFINITION_SCHEMA_VERSION } from "../domain/alarm-definition";
import type { AlarmEvent } from "../domain/alarm-event";
import type { AlarmInstance } from "../domain/alarm-instance";
import type { AlarmDefinitionRepository, AlarmEventRepository, AlarmStateRepository } from "../application/AlarmPorts";

const DATABASE_NAME = "scadatomic.alarms";
const DATABASE_VERSION = 1;
const DEFINITIONS = "definitions";
const EVENTS = "events";
const STATES = "states";
const PROJECT_INDEX = "projectId";
const ALARM_INDEX = "alarmId";

export class IndexedDbAlarmRepository implements AlarmDefinitionRepository, AlarmEventRepository, AlarmStateRepository {
  private databasePromise: Promise<IDBDatabase> | null = null;

  async list(projectId: string): Promise<AlarmDefinitionSummary[]> {
    const db = await this.getDatabase();
    const records = await runRequest<AlarmDefinition[]>(
      db.transaction(DEFINITIONS, "readonly").objectStore(DEFINITIONS).index(PROJECT_INDEX).getAll(projectId),
    );
    return records.filter(isSupportedDefinition).map(toSummary).sort((a, b) => a.name.localeCompare(b.name));
  }

  async get(alarmId: string): Promise<AlarmDefinition | null> {
    const db = await this.getDatabase();
    const value = await runRequest<AlarmDefinition | undefined>(
      db.transaction(DEFINITIONS, "readonly").objectStore(DEFINITIONS).get(alarmId),
    );
    if (!value) return null;
    if (!isSupportedDefinition(value)) throw new Error(`Unsupported alarm schema for ${alarmId}.`);
    return structuredClone(value);
  }

  async put(definition: AlarmDefinition): Promise<void> {
    const db = await this.getDatabase();
    const tx = db.transaction(DEFINITIONS, "readwrite");
    tx.objectStore(DEFINITIONS).put(structuredClone(definition));
    await waitForTransaction(tx);
  }

  async delete(alarmId: string): Promise<void> {
    const db = await this.getDatabase();
    const tx = db.transaction(DEFINITIONS, "readwrite");
    tx.objectStore(DEFINITIONS).delete(alarmId);
    await waitForTransaction(tx);
  }

  async append(event: AlarmEvent): Promise<void> {
    const db = await this.getDatabase();
    const tx = db.transaction(EVENTS, "readwrite");
    tx.objectStore(EVENTS).put(structuredClone(event));
    await waitForTransaction(tx);
  }

  async listEvents(projectId: string, options?: { alarmId?: string | undefined; limit?: number | undefined }): Promise<AlarmEvent[]> {
    const db = await this.getDatabase();
    const records = await runRequest<AlarmEvent[]>(
      db.transaction(EVENTS, "readonly").objectStore(EVENTS).index(PROJECT_INDEX).getAll(projectId),
    );
    const filtered = options?.alarmId ? records.filter((event) => event.alarmId === options.alarmId) : records;
    return structuredClone(filtered.sort((a, b) => b.timestamp - a.timestamp).slice(0, options?.limit ?? 1000));
  }

  async getState(projectId: string, alarmId: string): Promise<AlarmInstance | null> {
    const db = await this.getDatabase();
    const value = await runRequest<(AlarmInstance & { key: string }) | undefined>(
      db.transaction(STATES, "readonly").objectStore(STATES).get(stateKey(projectId, alarmId)),
    );
    if (!value) return null;
    const { key: _key, ...instance } = value;
    return structuredClone(instance);
  }

  async putState(instance: AlarmInstance): Promise<void> {
    const db = await this.getDatabase();
    const tx = db.transaction(STATES, "readwrite");
    tx.objectStore(STATES).put({ ...structuredClone(instance), key: stateKey(instance.projectId, instance.alarmId) });
    await waitForTransaction(tx);
  }

  async deleteState(projectId: string, alarmId: string): Promise<void> {
    const db = await this.getDatabase();
    const tx = db.transaction(STATES, "readwrite");
    tx.objectStore(STATES).delete(stateKey(projectId, alarmId));
    await waitForTransaction(tx);
  }

  private getDatabase(): Promise<IDBDatabase> {
    if (!this.databasePromise) this.databasePromise = openDatabase();
    return this.databasePromise;
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available."));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      const definitions = db.objectStoreNames.contains(DEFINITIONS)
        ? request.transaction!.objectStore(DEFINITIONS)
        : db.createObjectStore(DEFINITIONS, { keyPath: "id" });
      if (!definitions.indexNames.contains(PROJECT_INDEX)) definitions.createIndex(PROJECT_INDEX, "projectId", { unique: false });

      const events = db.objectStoreNames.contains(EVENTS)
        ? request.transaction!.objectStore(EVENTS)
        : db.createObjectStore(EVENTS, { keyPath: "id" });
      if (!events.indexNames.contains(PROJECT_INDEX)) events.createIndex(PROJECT_INDEX, "projectId", { unique: false });
      if (!events.indexNames.contains(ALARM_INDEX)) events.createIndex(ALARM_INDEX, "alarmId", { unique: false });

      if (!db.objectStoreNames.contains(STATES)) db.createObjectStore(STATES, { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open alarm database."));
    request.onblocked = () => reject(new Error("Alarm database upgrade is blocked by another tab."));
  });
}

function runRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Alarm storage request failed."));
  });
}

function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Alarm storage transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Alarm storage transaction aborted."));
  });
}

function toSummary(record: AlarmDefinition): AlarmDefinitionSummary {
  return {
    id: record.id,
    projectId: record.projectId,
    name: record.name,
    source: structuredClone(record.source),
    condition: structuredClone(record.condition),
    priority: record.priority,
    enabled: record.enabled,
    message: record.message,
    updatedAt: record.updatedAt,
  };
}

function isSupportedDefinition(value: unknown): value is AlarmDefinition {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<AlarmDefinition>;
  return record.schemaVersion === ALARM_DEFINITION_SCHEMA_VERSION && typeof record.id === "string" && typeof record.projectId === "string";
}

function stateKey(projectId: string, alarmId: string) { return `${projectId}::${alarmId}`; }
