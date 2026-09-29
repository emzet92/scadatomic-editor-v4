import type { ProcessRepository } from "../application/ProcessRepository";
import {
  PROCESS_DEFINITION_SCHEMA_VERSION,
  type ProcessDefinition,
  type ProcessSummary,
} from "../domain/process-definition";

const DATABASE_NAME = "scadatomic.processes";
const DATABASE_VERSION = 1;
const PROCESS_STORE_NAME = "processes";
const PROJECT_INDEX_NAME = "projectId";

export class IndexedDbProcessRepository implements ProcessRepository {
  private databasePromise: Promise<IDBDatabase> | null = null;

  async list(projectId: string): Promise<ProcessSummary[]> {
    const database = await this.getDatabase();
    const records = await runRequest<ProcessDefinition[]>(
      database
        .transaction(PROCESS_STORE_NAME, "readonly")
        .objectStore(PROCESS_STORE_NAME)
        .index(PROJECT_INDEX_NAME)
        .getAll(projectId),
    );

    return records
      .filter(isSupportedProcessDefinition)
      .map((record) => ({
        id: record.id,
        projectId: record.projectId,
        name: record.name,
        updatedAt: record.updatedAt,
      }))
      .sort((left, right) => right.updatedAt - left.updatedAt);
  }

  async get(processId: string): Promise<ProcessDefinition | null> {
    const database = await this.getDatabase();
    const record = await runRequest<ProcessDefinition | undefined>(
      database
        .transaction(PROCESS_STORE_NAME, "readonly")
        .objectStore(PROCESS_STORE_NAME)
        .get(processId),
    );

    if (!record) return null;
    if (!isSupportedProcessDefinition(record)) {
      throw new Error(`Unsupported process schema for ${processId}.`);
    }
    return structuredClone(record);
  }

  async put(definition: ProcessDefinition): Promise<void> {
    const database = await this.getDatabase();
    const transaction = database.transaction(PROCESS_STORE_NAME, "readwrite");
    transaction.objectStore(PROCESS_STORE_NAME).put(structuredClone(definition));
    await waitForTransaction(transaction);
  }

  async delete(processId: string): Promise<void> {
    const database = await this.getDatabase();
    const transaction = database.transaction(PROCESS_STORE_NAME, "readwrite");
    transaction.objectStore(PROCESS_STORE_NAME).delete(processId);
    await waitForTransaction(transaction);
  }

  private getDatabase(): Promise<IDBDatabase> {
    if (!this.databasePromise) this.databasePromise = openDatabase();
    return this.databasePromise;
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this environment."));
      return;
    }

    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      const store = database.objectStoreNames.contains(PROCESS_STORE_NAME)
        ? request.transaction!.objectStore(PROCESS_STORE_NAME)
        : database.createObjectStore(PROCESS_STORE_NAME, { keyPath: "id" });

      if (!store.indexNames.contains(PROJECT_INDEX_NAME)) {
        store.createIndex(PROJECT_INDEX_NAME, "projectId", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open process database."));
    request.onblocked = () => reject(new Error("Process database upgrade is blocked by another tab."));
  });
}

function runRequest<T = IDBValidKey>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Process storage request failed."));
  });
}

function isSupportedProcessDefinition(value: unknown): value is ProcessDefinition {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<ProcessDefinition>;
  return record.schemaVersion === PROCESS_DEFINITION_SCHEMA_VERSION &&
    typeof record.id === "string" &&
    typeof record.projectId === "string" &&
    typeof record.name === "string";
}

function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Process storage transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Process storage transaction was aborted."));
  });
}
