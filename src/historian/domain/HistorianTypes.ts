export type HistorianScalar = string | number | boolean | null;

export type HistorianThreshold =
  | { kind: "percent"; value: number }
  | { kind: "absolute"; value: number };

export type HistorianSamplingPolicy =
  | {
      kind: "on-change";
      threshold?: HistorianThreshold | undefined;
    }
  | {
      kind: "interval";
      intervalMs: number;
    }
  | {
      kind: "on-change-or-interval";
      threshold?: HistorianThreshold | undefined;
      intervalMs: number;
    };

export type HistorianTagConfig = {
  id: string;
  projectId: string;
  tagPath: string;
  enabled: boolean;
  policy: HistorianSamplingPolicy;
  createdAt: number;
  updatedAt: number;
};

export type HistorianSample = {
  id: string;
  projectId: string;
  tagPath: string;
  timestamp: number;
  value: HistorianScalar;
  quality?: "good" | "uncertain" | "bad" | undefined;
};

export type HistorianQuery = {
  projectId: string;
  tagPaths?: string[] | undefined;
  from?: number | undefined;
  to?: number | undefined;
  limit?: number | undefined;
  order?: "asc" | "desc" | undefined;
};

export type HistorianTagDescriptor = {
  path: string;
  valueKind: "number" | "string" | "boolean";
};

export function createDefaultHistorianConfig(
  projectId: string,
  tag: HistorianTagDescriptor,
  now = Date.now(),
): HistorianTagConfig {
  return {
    id: crypto.randomUUID(),
    projectId,
    tagPath: tag.path,
    enabled: true,
    policy:
      tag.valueKind === "number"
        ? { kind: "on-change", threshold: { kind: "percent", value: 1 } }
        : { kind: "on-change" },
    createdAt: now,
    updatedAt: now,
  };
}
