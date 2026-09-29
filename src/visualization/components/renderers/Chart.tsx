import type { CSSProperties, HTMLAttributes } from "react";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

import {
  CHART_SERIES_COLORS,
  readChartSeries,
  type ChartSeriesData,
  type ChartSeriesDefinition,
} from "../chart-series";
import type { ChartNodeProps, ChartPoint } from "../component-props";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
);

type ChartProps = HTMLAttributes<HTMLDivElement> &
  ChartNodeProps & {
    /** Runtime supplies fully resolved points per configured series. */
    runtimeSeries?: ChartSeriesData[] | undefined;
  };

const fallbackPoints: ChartPoint[] = [
  { label: "1", value: 20 },
  { label: "2", value: 35 },
  { label: "3", value: 28 },
  { label: "4", value: 44 },
  { label: "5", value: 38 },
];

export function Chart({
  title = "Trend",
  kind = "line",
  width = "100%",
  height,
  minHeight = 240,
  points = fallbackPoints,
  series,
  runtimeSeries,
  color = "#0284c7",
  showLegend = false,
  showGrid = true,
  timeRange: _timeRange,
  style,
  className,
  ...domProps
}: ChartProps) {
  void _timeRange;

  const datasets = runtimeSeries ?? buildEditorSeries({
    definitions: readChartSeries(series),
    explicitSeries: Array.isArray(series),
    points,
    title,
    legacyColor: color,
  });
  const { labels, valuesBySeries } = alignSeriesPoints(datasets);
  const chartHeight = height ?? minHeight ?? 240;
  const containerStyle: CSSProperties = {
    ...style,
    width,
  };

  if (kind === "bar") {
    const data: ChartData<"bar", Array<number | null>, string> = {
      labels,
      datasets: datasets.map((dataset, index) => ({
        label: dataset.label,
        data: valuesBySeries[index] ?? [],
        borderColor: dataset.color,
        backgroundColor: toTransparentColor(dataset.color, 0.35),
        borderWidth: 1,
        borderRadius: 6,
      })),
    };

    const options: ChartOptions<"bar"> = createChartOptions({
      showLegend,
      showGrid,
    });

    return (
      <ChartFrame
        {...domProps}
        title={title}
        className={className}
        style={containerStyle}
        chartHeight={chartHeight}
      >
        <Bar data={data} options={options} />
      </ChartFrame>
    );
  }

  const data: ChartData<"line", Array<number | null>, string> = {
    labels,
    datasets: datasets.map((dataset, index) => ({
      label: dataset.label,
      data: valuesBySeries[index] ?? [],
      borderColor: dataset.color,
      backgroundColor: toTransparentColor(dataset.color, 0.18),
      borderWidth: 2,
      pointRadius: datasets.length > 1 ? 1.5 : 3,
      pointHoverRadius: 5,
      tension: 0.35,
      fill: datasets.length === 1,
      spanGaps: true,
    })),
  };

  const options: ChartOptions<"line"> = createChartOptions({
    showLegend,
    showGrid,
  });

  return (
    <ChartFrame
      {...domProps}
      title={title}
      className={className}
      style={containerStyle}
      chartHeight={chartHeight}
    >
      <Line data={data} options={options} />
    </ChartFrame>
  );
}

function buildEditorSeries({
  definitions,
  explicitSeries,
  points,
  title,
  legacyColor,
}: {
  definitions: ChartSeriesDefinition[];
  explicitSeries: boolean;
  points: ChartPoint[];
  title: string;
  legacyColor: string;
}): ChartSeriesData[] {
  if (definitions.length === 0) {
    if (explicitSeries) return [];
    return [{
      id: "legacy",
      label: title,
      color: legacyColor,
      points,
    }];
  }

  return definitions.map((definition, index) => ({
    ...definition,
    points: index === 0
      ? points
      : points.map((point) => ({
          ...point,
          value: point.value + demoOffset(index),
        })),
  }));
}

function alignSeriesPoints(series: ChartSeriesData[]): {
  labels: string[];
  valuesBySeries: Array<Array<number | null>>;
} {
  const columns = new Map<
    string,
    { key: string; label: string; order: number }
  >();

  for (const dataset of series) {
    dataset.points.forEach((point, pointIndex) => {
      const key = pointKey(point, pointIndex);
      const order = point.timestamp ?? pointIndex;
      if (!columns.has(key)) {
        columns.set(key, { key, label: point.label, order });
      }
    });
  }

  const orderedColumns = [...columns.values()].sort((a, b) => a.order - b.order);
  const labels = orderedColumns.map((column) => column.label);
  const valuesBySeries = series.map((dataset) => {
    const values = new Map<string, number>();
    let staticIndex = 0;
    for (const point of dataset.points) {
      values.set(pointKey(point, staticIndex++), point.value);
    }
    return orderedColumns.map((column) => values.get(column.key) ?? null);
  });

  return { labels, valuesBySeries };
}

function pointKey(point: ChartPoint, staticIndex: number) {
  return point.timestamp === undefined
    ? `label:${staticIndex}:${point.label}`
    : `time:${point.timestamp}`;
}

function demoOffset(index: number) {
  return (index % CHART_SERIES_COLORS.length) * 6;
}

function ChartFrame({
  title,
  children,
  className,
  style,
  chartHeight,
  ...domProps
}: HTMLAttributes<HTMLDivElement> & {
  title?: string;
  chartHeight: CSSProperties["height"];
}) {
  return (
    <div
      {...domProps}
      className={`
        rounded-xl
        border
        border-zinc-200
        bg-white
        p-4
        shadow-sm
        overflow-hidden
        ${className ?? ""}
      `}
      style={style}
    >
      {title && (
        <div
          className="
            mb-3
            text-sm
            font-semibold
            text-zinc-900
          "
        >
          {title}
        </div>
      )}

      <div
        className="relative"
        style={{
          height: chartHeight,
          minHeight: chartHeight,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function createChartOptions<TType extends "line" | "bar">({
  showLegend,
  showGrid,
}: {
  showLegend: boolean;
  showGrid: boolean;
}): ChartOptions<TType> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        display: showLegend,
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          color: "#52525b",
        },
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#71717a",
          maxTicksLimit: 8,
        },
      },
      y: {
        grid: {
          display: showGrid,
          color: "#e4e4e7",
        },
        ticks: {
          color: "#71717a",
        },
      },
    },
  } as unknown as ChartOptions<TType>;
}

function toTransparentColor(color: string, alpha: number) {
  const hex = normalizeHexColor(color);
  if (!hex) return color;

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function normalizeHexColor(color: string) {
  const trimmed = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;

  const shortHex = trimmed.match(/^#([0-9a-fA-F]{3})$/);
  if (!shortHex) return null;
  const short = shortHex[1];
  if (!short) return null;
  const [r, g, b] = short.split("");
  return `#${r}${r}${g}${g}${b}${b}`;
}
