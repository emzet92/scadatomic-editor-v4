import type {
  HistorianQuery,
  HistorianSample,
  HistorianTagConfig,
  HistorianScalar,
} from "../domain";

export type HistorianUnsubscribe = () => void;

export interface HistorianConfigRepository {
  list(projectId: string): Promise<HistorianTagConfig[]>;
  getByTagPath(projectId: string, tagPath: string): Promise<HistorianTagConfig | undefined>;
  save(config: HistorianTagConfig): Promise<void>;
  remove(id: string): Promise<void>;
  subscribe(projectId: string, listener: () => void): HistorianUnsubscribe;
}

export interface HistorianSampleRepository {
  append(sample: HistorianSample): Promise<void>;
  query(query: HistorianQuery): Promise<HistorianSample[]>;
  getLatest(projectId: string, tagPath: string): Promise<HistorianSample | undefined>;
  clear(projectId: string, tagPath?: string): Promise<void>;
  subscribe(projectId: string, listener: () => void): HistorianUnsubscribe;
}

export interface HistorianValueSource {
  read(path: string): unknown;
  subscribe(path: string, listener: () => void): HistorianUnsubscribe;
}

export interface HistorianClock {
  now(): number;
}

export interface HistorianScheduler {
  every(intervalMs: number, listener: () => void): HistorianUnsubscribe;
}

export function toHistorianScalar(value: unknown): HistorianScalar | undefined {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  return undefined;
}
