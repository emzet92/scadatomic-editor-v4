import type { StateMachineRepository } from "../application/StateMachineRepository";
import {
  STATE_MACHINE_SCHEMA_VERSION,
  type StateMachineDefinition,
  type StateMachineSummary,
} from "../domain/state-machine-definition";

const DATABASE_NAME = "scadatomic.state-machines";
const DATABASE_VERSION = 1;
const STORE = "machines";
const PROJECT_INDEX = "projectId";

export class IndexedDbStateMachineRepository implements StateMachineRepository {
  private databasePromise: Promise<IDBDatabase> | null = null;

  async list(projectId: string): Promise<StateMachineSummary[]> {
    const database = await this.getDatabase();
    const records = await request<StateMachineDefinition[]>(
      database.transaction(STORE, "readonly").objectStore(STORE).index(PROJECT_INDEX).getAll(projectId),
    );
    return records
      .filter(isSupported)
      .map(({ id, projectId: owner, name, updatedAt }) => ({ id, projectId: owner, name, updatedAt }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async get(machineId: string): Promise<StateMachineDefinition | null> {
    const database = await this.getDatabase();
    const record = await request<StateMachineDefinition | undefined>(
      database.transaction(STORE, "readonly").objectStore(STORE).get(machineId),
    );
    if (!record) return null;
    if (!isSupported(record)) throw new Error(`Unsupported state-machine schema for ${machineId}.`);
    return structuredClone(record);
  }

  async put(definition: StateMachineDefinition): Promise<void> {
    const database = await this.getDatabase();
    const transaction = database.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).put(structuredClone(definition));
    await waitForTransaction(transaction);
  }

  async delete(machineId: string): Promise<void> {
    const database = await this.getDatabase();
    const transaction = database.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).delete(machineId);
    await waitForTransaction(transaction);
  }

  private getDatabase() {
    if (!this.databasePromise) this.databasePromise = openDatabase();
    return this.databasePromise;
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB is not available."));
    const open = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    open.onupgradeneeded = () => {
      const db = open.result;
      const store = db.objectStoreNames.contains(STORE)
        ? open.transaction!.objectStore(STORE)
        : db.createObjectStore(STORE, { keyPath: "id" });
      if (!store.indexNames.contains(PROJECT_INDEX)) store.createIndex(PROJECT_INDEX, "projectId", { unique: false });
    };
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error ?? new Error("Failed to open state-machine database."));
    open.onblocked = () => reject(new Error("State-machine database upgrade is blocked by another tab."));
  });
}

function request<T>(value: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    value.onsuccess = () => resolve(value.result);
    value.onerror = () => reject(value.error ?? new Error("State-machine storage request failed."));
  });
}

function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("State-machine transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("State-machine transaction was aborted."));
  });
}

function isSupported(value: unknown): value is StateMachineDefinition {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<StateMachineDefinition>;
  return record.schemaVersion === STATE_MACHINE_SCHEMA_VERSION && typeof record.id === "string" && typeof record.projectId === "string";
}
