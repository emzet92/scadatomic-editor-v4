import type {
  CSSProperties,
  HTMLAttributes,
} from "react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type ChartOptions,
} from "chart.js";

import {
  Line,
  Bar,
} from "react-chartjs-2";
import type { ChartNodeProps } from "../UiTree";


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
);

type ChartProps =
  HTMLAttributes<HTMLDivElement> &
  ChartNodeProps;

const fallbackPoints = [
  {
    label: "1",
    value: 20,
  },
  {
    label: "2",
    value: 35,
  },
  {
    label: "3",
    value: 28,
  },
  {
    label: "4",
    value: 44,
  },
  {
    label: "5",
    value: 38,
  },
];

export function Chart({
  title = "Trend",
  kind = "line",

  tag,

  width = "100%",
  height,
  minHeight = 240,

  points = fallbackPoints,

  color = "#0284c7",

  showLegend = false,
  showGrid = true,

  style,
  className,
  ...domProps
}: ChartProps) {
  const safePoints =
    points.length > 0
      ? points
      : fallbackPoints;

  const labels =
    safePoints.map(
      (point) => point.label
    );

  const values =
    safePoints.map(
      (point) => point.value
    );

  const containerStyle: CSSProperties = {
    ...style,
    width,
    height,
    minHeight,
  };

  if (kind === "bar") {
    const data: ChartData<
      "bar",
      number[],
      string
    > = {
      labels,
      datasets: [
        {
          label: title,
          data: values,
          borderColor: color,
          backgroundColor:
            toTransparentColor(
              color,
              0.35
            ),
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };

    const options: ChartOptions<"bar"> =
      createChartOptions({
        title,
        showLegend,
        showGrid,
      });

    return (
      <ChartFrame
        {...domProps}
        title={title}
        className={className}
        style={containerStyle}
      >
        <Bar
          data={data}
          options={options}
        />
      </ChartFrame>
    );
  }

  const data: ChartData<
    "line",
    number[],
    string
  > = {
    labels,
    datasets: [
      {
        label: title,
        data: values,
        borderColor: color,
        backgroundColor:
          toTransparentColor(
            color,
            0.18
          ),
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const options: ChartOptions<"line"> =
    createChartOptions({
      title,
      showLegend,
      showGrid,
    });

  return (
    <ChartFrame
      {...domProps}
      title={title}
      className={className}
      style={containerStyle}
    >
      <Line
        data={data}
        options={options}
      />
    </ChartFrame>
  );
}

function ChartFrame({
  title,
  children,
  className,
  style,
  ...domProps
}: HTMLAttributes<HTMLDivElement> & {
  title?: string;
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
        className="
          relative
          h-full
          min-h-[180px]
        "
      >
        {children}
      </div>
    </div>
  );
}

function createChartOptions<
  TType extends "line" | "bar"
>({
  showLegend,
  showGrid,
}: {
  title: string;
  showLegend: boolean;
  showGrid: boolean;
}): ChartOptions<TType> {
  return {
      responsive: true,
      maintainAspectRatio: false,

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

function toTransparentColor(
  color: string,
  alpha: number
) {
  const hex =
    normalizeHexColor(color);

  if (!hex) {
    return color;
  }

  const r =
    parseInt(hex.slice(1, 3), 16);

  const g =
    parseInt(hex.slice(3, 5), 16);

  const b =
    parseInt(hex.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function normalizeHexColor(
  color: string
) {
  const trimmed =
    color.trim();

  if (
    /^#[0-9a-fA-F]{6}$/.test(trimmed)
  ) {
    return trimmed;
  }

  const shortHex =
    trimmed.match(
      /^#([0-9a-fA-F]{3})$/
    );

  if (!shortHex) {
    return null;
  }

  const [r, g, b] =
    shortHex[1].split("");

  return `#${r}${r}${g}${g}${b}${b}`;
}