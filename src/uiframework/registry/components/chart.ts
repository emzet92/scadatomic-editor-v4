import { Chart } from "../../components/Chart";
import { RuntimeChart } from "../../components/RuntimeChart";
import { defaultChartProps } from "../../component-props";
import type { ComponentDefinition } from "../component-definition-types";

export const chartDefinition = {
  type: "Chart",
  label: "Chart",
  description: "Line or bar chart",
  editor: Chart,
  runtime: RuntimeChart,
  defaults: defaultChartProps,
  inspector: {
    title: { kind: "text" },
    kind: { kind: "select", options: ["line", "bar"] },
    width: { kind: "text" },
    height: { kind: "text" },
    minHeight: { kind: "text" },
    series: { kind: "chart-series" },
    showLegend: { kind: "toggle" },
    showGrid: { kind: "toggle" },
    timeRange: { kind: "time-range" },
  },
  bindings: {
    visible: { label: "Visible", valueType: "boolean" },
  },
} satisfies ComponentDefinition;
