const DB_NAME = "scadatomic-historian";
const DB_VERSION = 1;

export const HISTORIAN_CONFIG_STORE = "configs";
export const HISTORIAN_SAMPLE_STORE = "samples";

let databasePromise: Promise<IDBDatabase> | undefined;

export function openHistorianDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(HISTORIAN_CONFIG_STORE)) {
        const configs = db.createObjectStore(HISTORIAN_CONFIG_STORE, { keyPath: "id" });
        configs.createIndex("projectId", "projectId", { unique: false });
        configs.createIndex("projectTag", ["projectId", "tagPath"], { unique: true });
      }
      if (!db.objectStoreNames.contains(HISTORIAN_SAMPLE_STORE)) {
        const samples = db.createObjectStore(HISTORIAN_SAMPLE_STORE, { keyPath: "id" });
        samples.createIndex("projectTimestamp", ["projectId", "timestamp"], { unique: false });
        samples.createIndex(
          "projectTagTimestamp",
          ["projectId", "tagPath", "timestamp"],
          { unique: false },
        );
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open historian database."));
  });
  return databasePromise;
}

export function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Historian transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Historian transaction aborted."));
  });
}

export function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Historian request failed."));
  });
}
