export type RelativeChartTimeRange = {
  kind: "relative";
  durationMs: number;
};

export const CHART_TIME_RANGE_PRESETS = [
  { label: "1 min", durationMs: 60_000 },
  { label: "2 min", durationMs: 2 * 60_000 },
  { label: "5 min", durationMs: 5 * 60_000 },
  { label: "10 min", durationMs: 10 * 60_000 },
] as const;

export const DEFAULT_CHART_TIME_RANGE: RelativeChartTimeRange = {
  kind: "relative",
  durationMs: CHART_TIME_RANGE_PRESETS[0].durationMs,
};

export const MAX_CHART_TIME_RANGE_MS = 10 * 60_000;

export function createRelativeChartTimeRange(
  durationMs: number,
): RelativeChartTimeRange {
  return {
    kind: "relative",
    durationMs: normalizeChartTimeRangeDuration(durationMs),
  };
}

export function getChartTimeRangeDurationMs(value: unknown): number {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_CHART_TIME_RANGE.durationMs;
  }

  const candidate = value as Partial<RelativeChartTimeRange>;
  if (candidate.kind !== "relative" || typeof candidate.durationMs !== "number") {
    return DEFAULT_CHART_TIME_RANGE.durationMs;
  }

  return normalizeChartTimeRangeDuration(candidate.durationMs);
}

function normalizeChartTimeRangeDuration(durationMs: number): number {
  const preset = CHART_TIME_RANGE_PRESETS.find(
    (candidate) => candidate.durationMs === durationMs,
  );

  return preset?.durationMs ?? DEFAULT_CHART_TIME_RANGE.durationMs;
}
