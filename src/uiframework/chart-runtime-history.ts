import type { ChartPoint } from "./component-props";
import type { RuntimeSignalSample } from "./runtime-signals";

export function buildRuntimeChartPoints({
  history,
  currentValue,
  fromTimestamp,
  toTimestamp,
}: {
  history: readonly RuntimeSignalSample[];
  currentValue: unknown;
  fromTimestamp: number;
  toTimestamp: number;
}): ChartPoint[] {
  const samples = selectWindowSamples({
    history,
    currentValue,
    fromTimestamp,
    toTimestamp,
  });

  return samples
    .map((sample): ChartPoint | null => {
      const value = toNumber(sample.value);
      return value === null
        ? null
        : {
            label: formatTimestamp(sample.timestamp),
            value,
            timestamp: sample.timestamp,
          };
    })
    .filter((point): point is ChartPoint => point !== null);
}

export function selectRuntimeChartWindowSamples({
  history,
  currentValue,
  fromTimestamp,
  toTimestamp,
}: {
  history: readonly RuntimeSignalSample[];
  currentValue: unknown;
  fromTimestamp: number;
  toTimestamp: number;
}): RuntimeSignalSample[] {
  return selectWindowSamples({
    history,
    currentValue,
    fromTimestamp,
    toTimestamp,
  });
}

function selectWindowSamples({
  history,
  currentValue,
  fromTimestamp,
  toTimestamp,
}: {
  history: readonly RuntimeSignalSample[];
  currentValue: unknown;
  fromTimestamp: number;
  toTimestamp: number;
}): RuntimeSignalSample[] {
  let predecessor: RuntimeSignalSample | undefined;
  const visible: RuntimeSignalSample[] = [];

  for (const sample of history) {
    if (sample.timestamp <= fromTimestamp) {
      predecessor = sample;
      continue;
    }

    if (sample.timestamp <= toTimestamp) {
      visible.push(sample);
    }
  }

  const result: RuntimeSignalSample[] = [];

  if (predecessor) {
    result.push({
      timestamp: fromTimestamp,
      value: predecessor.value,
    });
  } else if (visible.length === 0 && currentValue !== undefined) {
    result.push({
      timestamp: fromTimestamp,
      value: currentValue,
    });
  }

  result.push(...visible);

  if (currentValue !== undefined) {
    const last = result[result.length - 1];
    if (!last || last.timestamp < toTimestamp || !Object.is(last.value, currentValue)) {
      result.push({
        timestamp: toTimestamp,
        value: currentValue,
      });
    }
  }

  return result;
}

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  if (typeof value === "string") {
    const normalized = value.replace(",", ".").replace(/[^\d.-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}
