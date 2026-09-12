import type { Binding } from "./core/document";
import type { ChartPoint } from "./component-props";

export type ChartSeriesDefinition = {
  id: string;
  label: string;
  color: string;
};

export type ChartSeriesData = ChartSeriesDefinition & {
  points: ChartPoint[];
};

export const CHART_SERIES_COLORS = [
  "#0284c7",
  "#16a34a",
  "#dc2626",
  "#9333ea",
  "#ea580c",
  "#0891b2",
] as const;

const SERIES_BINDING_PREFIX = "series:";

export function chartSeriesBindingKey(seriesId: string) {
  return `${SERIES_BINDING_PREFIX}${seriesId}`;
}

export function createChartSeriesDefinition(
  index: number,
  overrides: Partial<Omit<ChartSeriesDefinition, "id">> = {},
): ChartSeriesDefinition {
  return {
    id: createSeriesId(),
    label: overrides.label ?? `Data point ${index + 1}`,
    color: overrides.color ?? CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length]!,
  };
}

export function readChartSeries(value: unknown): ChartSeriesDefinition[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const item = candidate as Partial<ChartSeriesDefinition>;
    if (typeof item.id !== "string" || !item.id.trim()) return [];

    return [{
      id: item.id,
      label: typeof item.label === "string" && item.label.trim()
        ? item.label
        : "Data point",
      color: typeof item.color === "string" && item.color.trim()
        ? item.color
        : CHART_SERIES_COLORS[0],
    }];
  });
}

export function getChartSeriesBinding(
  bindings: Record<string, Binding> | undefined,
  seriesId: string,
): Binding | undefined {
  return bindings?.[chartSeriesBindingKey(seriesId)];
}

function createSeriesId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `chart-series-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
