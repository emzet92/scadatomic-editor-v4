import { useEffect, useState } from "react";
import type { Binding } from "../core/document";
import {
  useRuntimeSignal,
  useRuntimeSignalHistory,
} from "../runtime-signals";
import type { ChartNodeProps } from "../component-props";
import {
  DEFAULT_CHART_TIME_RANGE,
  getChartTimeRangeDurationMs,
} from "../chart-time-range";
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
  timeRange = DEFAULT_CHART_TIME_RANGE,
  ...props
}: RuntimeChartProps) {
  const valueBinding = runtimeBindings?.value;
  const tag = valueBinding?.kind === "tag" ? valueBinding.path : undefined;
  const history = useRuntimeSignalHistory(tag);
  const currentValue = useRuntimeSignal(tag);
  const now = useWindowClock(Boolean(tag));
  const durationMs = getChartTimeRangeDurationMs(timeRange);

  const runtimePoints = tag
    ? buildRuntimeChartPoints({
        history,
        currentValue,
        fromTimestamp: now - durationMs,
        toTimestamp: now,
      })
    : [];

  const resolvedPoints = tag ? runtimePoints : points;

  return (
    <Chart
      {...props}
      {...(resolvedPoints === undefined ? {} : { points: resolvedPoints })}
    />
  );
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
