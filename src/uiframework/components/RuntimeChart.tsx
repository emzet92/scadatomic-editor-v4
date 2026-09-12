import { useEffect, useMemo, useReducer, useState } from "react";
import type { Binding } from "../core/document";
import { runtimeSignals } from "../runtime-signals";
import type { ChartNodeProps } from "../component-props";
import {
  DEFAULT_CHART_TIME_RANGE,
  getChartTimeRangeDurationMs,
} from "../chart-time-range";
import {
  chartSeriesBindingKey,
  readChartSeries,
  type ChartSeriesDefinition,
} from "../chart-series";
import { buildRuntimeChartPoints } from "../chart-runtime-history";
import { Chart } from "./Chart";

type RuntimeChartProps = React.ComponentProps<typeof Chart> &
  ChartNodeProps & {
    runtimeBindings?: Record<string, Binding>;
  };

const WINDOW_CLOCK_INTERVAL_MS = 1_000;

export function RuntimeChart({
  runtimeBindings,
  points,
  series,
  color = "#0284c7",
  title = "Trend",
  timeRange = DEFAULT_CHART_TIME_RANGE,
  ...props
}: RuntimeChartProps) {
  const configuredSeries = useMemo(
    () => buildConfiguredSeries({ series, runtimeBindings, title, color }),
    [series, runtimeBindings, title, color],
  );
  const tags = useMemo(
    () => [...new Set(configuredSeries.flatMap((item) => item.tag ? [item.tag] : []))],
    [configuredSeries],
  );
  const [, forceRender] = useReducer((version: number) => version + 1, 0);

  useEffect(() => {
    if (tags.length === 0) return undefined;
    const unsubscribe = tags.map((tag) => runtimeSignals.subscribe(tag, forceRender));
    return () => unsubscribe.forEach((stop) => stop());
  }, [tags]);

  const now = useWindowClock(tags.length > 0);
  const durationMs = getChartTimeRangeDurationMs(timeRange);
  const hasRuntimeBindings = configuredSeries.some((item) => Boolean(item.tag));
  const runtimeSeries = hasRuntimeBindings
    ? configuredSeries.flatMap((item) => {
        if (!item.tag) return [];
        return [{
          id: item.definition.id,
          label: item.definition.label,
          color: item.definition.color,
          points: buildRuntimeChartPoints({
            history: runtimeSignals.getHistory(item.tag),
            currentValue: runtimeSignals.get(item.tag),
            fromTimestamp: now - durationMs,
            toTimestamp: now,
          }),
        }];
      })
    : undefined;

  return (
    <Chart
      {...props}
      title={title}
      color={color}
      timeRange={timeRange}
      {...(series === undefined ? {} : { series })}
      {...(points === undefined ? {} : { points })}
      {...(runtimeSeries === undefined ? {} : { runtimeSeries })}
    />
  );
}

function buildConfiguredSeries({
  series,
  runtimeBindings,
  title,
  color,
}: {
  series: ChartNodeProps["series"];
  runtimeBindings: Record<string, Binding> | undefined;
  title: string;
  color: string;
}): Array<{ definition: ChartSeriesDefinition; tag?: string }> {
  const definitions = readChartSeries(series);

  if (definitions.length > 0) {
    return definitions.map((definition) => {
      const binding = runtimeBindings?.[chartSeriesBindingKey(definition.id)];
      return {
        definition,
        ...(binding?.kind === "tag" ? { tag: binding.path } : {}),
      };
    });
  }

  const legacyBinding = runtimeBindings?.value;
  if (legacyBinding?.kind !== "tag") return [];

  return [{
    definition: {
      id: "legacy",
      label: title,
      color,
    },
    tag: legacyBinding.path,
  }];
}

function useWindowClock(enabled: boolean) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return undefined;

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, WINDOW_CLOCK_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [enabled]);

  return now;
}
