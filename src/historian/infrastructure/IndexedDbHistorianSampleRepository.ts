import type { HistorianSampleRepository } from "../application";
import type { HistorianQuery, HistorianSample } from "../domain";
import { historianChangeBus } from "./HistorianChangeBus";
import {
  HISTORIAN_SAMPLE_STORE,
  openHistorianDatabase,
  requestResult,
  waitForTransaction,
} from "./historian-db";

const LOWEST_TIMESTAMP = 0;
const HIGHEST_TIMESTAMP = Number.MAX_SAFE_INTEGER;

export class IndexedDbHistorianSampleRepository implements HistorianSampleRepository {
  async append(sample: HistorianSample): Promise<void> {
    const db = await openHistorianDatabase();
    const transaction = db.transaction(HISTORIAN_SAMPLE_STORE, "readwrite");
    transaction.objectStore(HISTORIAN_SAMPLE_STORE).put(structuredClone(sample));
    await waitForTransaction(transaction);
    historianChangeBus.publish(sample.projectId, "sample");
  }

  async query(query: HistorianQuery): Promise<HistorianSample[]> {
    const db = await openHistorianDatabase();
    const transaction = db.transaction(HISTORIAN_SAMPLE_STORE, "readonly");
    const store = transaction.objectStore(HISTORIAN_SAMPLE_STORE);
    const from = query.from ?? LOWEST_TIMESTAMP;
    const to = query.to ?? HIGHEST_TIMESTAMP;
    const samples: HistorianSample[] = [];

    if (query.tagPaths?.length === 1) {
      const index = store.index("projectTagTimestamp");
      const range = IDBKeyRange.bound(
        [query.projectId, query.tagPaths[0]!, from],
        [query.projectId, query.tagPaths[0]!, to],
      );
      samples.push(...((await requestResult(index.getAll(range))) as HistorianSample[]));
    } else {
      const index = store.index("projectTimestamp");
      const range = IDBKeyRange.bound(
        [query.projectId, from],
        [query.projectId, to],
      );
      samples.push(...((await requestResult(index.getAll(range))) as HistorianSample[]));
    }

    const selected = query.tagPaths?.length
      ? samples.filter((sample) => query.tagPaths!.includes(sample.tagPath))
      : samples;
    selected.sort((left, right) => left.timestamp - right.timestamp);
    if (query.order === "desc") selected.reverse();
    if (query.limit && selected.length > query.limit) return selected.slice(0, query.limit);
    return selected;
  }

  async getLatest(projectId: string, tagPath: string): Promise<HistorianSample | undefined> {
    const db = await openHistorianDatabase();
    const transaction = db.transaction(HISTORIAN_SAMPLE_STORE, "readonly");
    const index = transaction.objectStore(HISTORIAN_SAMPLE_STORE).index("projectTagTimestamp");
    const range = IDBKeyRange.bound(
      [projectId, tagPath, LOWEST_TIMESTAMP],
      [projectId, tagPath, HIGHEST_TIMESTAMP],
    );
    return new Promise((resolve, reject) => {
      const request = index.openCursor(range, "prev");
      request.onsuccess = () => resolve(request.result?.value as HistorianSample | undefined);
      request.onerror = () => reject(request.error ?? new Error("Failed to read latest historian sample."));
    });
  }

  async clear(projectId: string, tagPath?: string): Promise<void> {
    const samples = await this.query({ projectId, ...(tagPath ? { tagPaths: [tagPath] } : {}) });
    if (samples.length === 0) return;
    const db = await openHistorianDatabase();
    const transaction = db.transaction(HISTORIAN_SAMPLE_STORE, "readwrite");
    const store = transaction.objectStore(HISTORIAN_SAMPLE_STORE);
    for (const sample of samples) store.delete(sample.id);
    await waitForTransaction(transaction);
    historianChangeBus.publish(projectId, "sample");
  }

  subscribe(projectId: string, listener: () => void) {
    return historianChangeBus.subscribe(projectId, "sample", listener);
  }
}

export const indexedDbHistorianSampleRepository = new IndexedDbHistorianSampleRepository();
