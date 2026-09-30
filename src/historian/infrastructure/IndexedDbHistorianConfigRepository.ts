import type { HistorianConfigRepository } from "../application";
import type { HistorianTagConfig } from "../domain";
import { historianChangeBus } from "./HistorianChangeBus";
import {
  HISTORIAN_CONFIG_STORE,
  openHistorianDatabase,
  requestResult,
  waitForTransaction,
} from "./historian-db";

export class IndexedDbHistorianConfigRepository implements HistorianConfigRepository {
  async list(projectId: string): Promise<HistorianTagConfig[]> {
    const db = await openHistorianDatabase();
    const transaction = db.transaction(HISTORIAN_CONFIG_STORE, "readonly");
    const index = transaction.objectStore(HISTORIAN_CONFIG_STORE).index("projectId");
    const result = await requestResult(index.getAll(IDBKeyRange.only(projectId)));
    return (result as HistorianTagConfig[]).sort((left, right) => left.tagPath.localeCompare(right.tagPath));
  }

  async getByTagPath(projectId: string, tagPath: string): Promise<HistorianTagConfig | undefined> {
    const db = await openHistorianDatabase();
    const transaction = db.transaction(HISTORIAN_CONFIG_STORE, "readonly");
    const index = transaction.objectStore(HISTORIAN_CONFIG_STORE).index("projectTag");
    return (await requestResult(index.get([projectId, tagPath]))) as HistorianTagConfig | undefined;
  }

  async save(config: HistorianTagConfig): Promise<void> {
    const db = await openHistorianDatabase();
    const transaction = db.transaction(HISTORIAN_CONFIG_STORE, "readwrite");
    transaction.objectStore(HISTORIAN_CONFIG_STORE).put(structuredClone(config));
    await waitForTransaction(transaction);
    historianChangeBus.publish(config.projectId, "config");
  }

  async remove(id: string): Promise<void> {
    const db = await openHistorianDatabase();
    const readTransaction = db.transaction(HISTORIAN_CONFIG_STORE, "readonly");
    const existing = (await requestResult(
      readTransaction.objectStore(HISTORIAN_CONFIG_STORE).get(id),
    )) as HistorianTagConfig | undefined;
    if (!existing) return;

    const transaction = db.transaction(HISTORIAN_CONFIG_STORE, "readwrite");
    transaction.objectStore(HISTORIAN_CONFIG_STORE).delete(id);
    await waitForTransaction(transaction);
    historianChangeBus.publish(existing.projectId, "config");
  }

  subscribe(projectId: string, listener: () => void) {
    return historianChangeBus.subscribe(projectId, "config", listener);
  }
}

export const indexedDbHistorianConfigRepository = new IndexedDbHistorianConfigRepository();
