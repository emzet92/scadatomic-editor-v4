import type {
  AssetId,
  AssetRecord,
  AssetRef,
  AssetStore,
  PutAssetInput,
} from "./AssetStore";

const DATABASE_NAME = "scadatomic.assets";
const DATABASE_VERSION = 1;
const ASSET_STORE_NAME = "assets";

export class IndexedDbAssetStore implements AssetStore {
  private databasePromise: Promise<IDBDatabase> | null = null;

  async put(input: PutAssetInput): Promise<AssetRef> {
    const record: AssetRecord = {
      id: input.id ?? crypto.randomUUID(),
      name: input.metadata.name,
      mimeType: input.metadata.mimeType,
      size: input.blob.size,
      kind: input.metadata.kind,
      blob: input.blob,
      createdAt: Date.now(),
    };

    const database = await this.getDatabase();
    await runRequest(
      database
        .transaction(ASSET_STORE_NAME, "readwrite")
        .objectStore(ASSET_STORE_NAME)
        .put(record)
    );

    return toAssetRef(record);
  }

  async get(assetId: AssetId): Promise<AssetRecord | null> {
    const database = await this.getDatabase();
    const value = await runRequest<AssetRecord | undefined>(
      database
        .transaction(ASSET_STORE_NAME, "readonly")
        .objectStore(ASSET_STORE_NAME)
        .get(assetId)
    );

    return value ?? null;
  }

  async delete(assetId: AssetId): Promise<void> {
    const database = await this.getDatabase();
    await runRequest(
      database
        .transaction(ASSET_STORE_NAME, "readwrite")
        .objectStore(ASSET_STORE_NAME)
        .delete(assetId)
    );
  }

  async exists(assetId: AssetId): Promise<boolean> {
    const database = await this.getDatabase();
    const key = await runRequest<IDBValidKey | undefined>(
      database
        .transaction(ASSET_STORE_NAME, "readonly")
        .objectStore(ASSET_STORE_NAME)
        .getKey(assetId)
    );

    return key !== undefined;
  }

  async list(): Promise<AssetRef[]> {
    const database = await this.getDatabase();
    const records = await runRequest<AssetRecord[]>(
      database
        .transaction(ASSET_STORE_NAME, "readonly")
        .objectStore(ASSET_STORE_NAME)
        .getAll()
    );

    return records.map(toAssetRef);
  }

  private getDatabase(): Promise<IDBDatabase> {
    if (!this.databasePromise) {
      this.databasePromise = openDatabase();
    }
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
      if (!database.objectStoreNames.contains(ASSET_STORE_NAME)) {
        database.createObjectStore(ASSET_STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open asset database."));
    request.onblocked = () => reject(new Error("Asset database upgrade is blocked by another tab."));
  });
}

function runRequest<T = IDBValidKey>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Asset storage request failed."));
  });
}

function toAssetRef(record: AssetRecord): AssetRef {
  return {
    id: record.id,
    name: record.name,
    mimeType: record.mimeType,
    size: record.size,
    kind: record.kind,
  };
}
