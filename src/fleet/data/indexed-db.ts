const DATABASE_NAME = "scadatomic-cloud-dev";
const DATABASE_VERSION = 1;

export const FLEET_STORES = {
  devices: "fleet-devices",
  registrationKeys: "fleet-registration-keys",
} as const;

type FleetStoreName = (typeof FLEET_STORES)[keyof typeof FLEET_STORES];

let databasePromise: Promise<IDBDatabase> | null = null;

export function openFleetDatabase(): Promise<IDBDatabase> {
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(FLEET_STORES.devices)) {
          const store = database.createObjectStore(FLEET_STORES.devices, {
            keyPath: "id",
          });
          store.createIndex("projectId", "projectId", { unique: false });
        }

        if (
          !database.objectStoreNames.contains(FLEET_STORES.registrationKeys)
        ) {
          const store = database.createObjectStore(
            FLEET_STORES.registrationKeys,
            { keyPath: "id" }
          );
          store.createIndex("projectId", "projectId", { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
    });
  }

  return databasePromise;
}

export async function getAllByProject<T extends { projectId: string }>(
  storeName: FleetStoreName,
  projectId: string
): Promise<T[]> {
  const database = await openFleetDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const index = store.index("projectId");
    const request = index.getAll(projectId);

    request.onsuccess = () => resolve((request.result ?? []) as T[]);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB read failed"));
  });
}

export async function putRecord<T>(
  storeName: FleetStoreName,
  record: T
): Promise<void> {
  const database = await openFleetDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    store.put(record);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB write failed"));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB write aborted"));
  });
}

export async function deleteRecord(
  storeName: FleetStoreName,
  id: string
): Promise<void> {
  const database = await openFleetDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(id);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB delete failed"));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB delete aborted"));
  });
}
