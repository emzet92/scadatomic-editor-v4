import type { Binding } from "../core/document";
import { useRuntimeSignalHistory } from "../runtime-signals";
import type { ChartNodeProps, ChartPoint } from "../component-props";
import { Chart } from "./Chart";

type RuntimeChartProps = React.ComponentProps<typeof Chart> &
  ChartNodeProps & {
    runtimeBindings?: Record<string, Binding>;
    historyLimit?: number;
  };

export function RuntimeChart({
  runtimeBindings,
  points,
  historyLimit = 30,
  ...props
}: RuntimeChartProps) {
  const valueBinding = runtimeBindings?.value;
  const tag = valueBinding?.kind === "tag" ? valueBinding.path : undefined;
  const history = useRuntimeSignalHistory(tag);

  const runtimePoints: ChartPoint[] = history
    .slice(-historyLimit)
    .map((sample) => {
      const value = toNumber(sample.value);

      return value === null
        ? null
        : {
            label: new Date(sample.timestamp).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            value,
          };
    })
    .filter((point): point is ChartPoint => point !== null);

  const resolvedPoints = runtimePoints.length > 0 ? runtimePoints : points;

  return (
    <Chart
      {...props}
      {...(resolvedPoints === undefined ? {} : { points: resolvedPoints })}
    />
  );
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
