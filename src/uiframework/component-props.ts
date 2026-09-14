import type { TypographyStyle } from "./design-system/typography";
import {
  DEFAULT_CHART_TIME_RANGE,
  type RelativeChartTimeRange,
} from "./chart-time-range";
import type { ChartSeriesDefinition } from "./chart-series";

export type CssSize = number | string;

export type PageDeviceMode = "desktop" | "tablet" | "mobile";

export type PageNodeProps = {
  deviceMode?: PageDeviceMode;
  width?: CssSize;
  height?: CssSize;
  backgroundColor?: string;
  padding?: number;
  gap?: number;
  columns?: number;
  display?: "grid" | "flex";
  /** Ephemeral render-only flag used when a Page is projected into a layout slot. */
  embeddedInLayout?: boolean;
};

export const defaultPageProps = {
  deviceMode: "desktop",
  width: 1440,
  height: 900,
  backgroundColor: "#ffffff",
  padding: 24,
  gap: 12,
  columns: 1,
  display: "grid",
} satisfies PageNodeProps;

export type ContainerGridMode = "fixed" | "adaptive";
export type ContainerGridRowMode = "content" | "minimum";
export type ContainerGridItemAlignment = "start" | "center" | "end" | "stretch";

export type ContainerNodeProps = {
  width?: CssSize;
  height?: CssSize;
  minWidth?: CssSize;
  minHeight?: CssSize;
  maxWidth?: CssSize;
  maxHeight?: CssSize;
  padding?: number;
  gap?: number;
  columns?: number;
  gridMode?: ContainerGridMode;
  minColumnWidth?: number;
  minRowHeight?: number;
  gridRowMode?: ContainerGridRowMode;
  gridItemAlignment?: ContainerGridItemAlignment;
  borderSize?: number;
  display?: "grid" | "flex";
};

export const defaultContainerProps = {
  width: "100%",
  minHeight: 80,
  padding: 12,
  gap: 12,
  columns: 1,
  gridMode: "fixed",
  minColumnWidth: 220,
  minRowHeight: 64,
  gridRowMode: "content",
  gridItemAlignment: "start",
  borderSize: 1,
  display: "grid",
} satisfies ContainerNodeProps;

export type TextAlign = "left" | "center" | "right";
export type TextWeight = "normal" | "medium" | "semibold" | "bold";
export type TextVariant = "body" | "label" | "title" | "caption";

export type TextNodeProps = {
  value?: string | number;
  color?: string;
  /** Resolved local/token typography style. Legacy individual fields remain compatible. */
  textStyle?: TypographyStyle;
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: CssSize;
  fontWeight?: TextWeight;
  letterSpacing?: number;
  align?: TextAlign;
  variant?: TextVariant;
  italic?: boolean;
  underline?: boolean;
  uppercase?: boolean;
  borderSize?: number;
  borderColor?: string;
  borderRadius?: number;
};

export const defaultTextProps = {
  value: "Text",
  color: "#18181b",
  fontSize: 14,
  lineHeight: "20px",
  fontWeight: "normal",
  align: "left",
  variant: "body",
  italic: false,
  underline: false,
  uppercase: false,
  borderSize: 0,
  borderColor: "#d4d4d8",
  borderRadius: 0,
} satisfies TextNodeProps;

export const defaultTextPropsByVariant = {
  body: {
    fontSize: 14,
    lineHeight: "20px",
    fontWeight: "normal",
  },
  label: {
    fontSize: 12,
    lineHeight: "16px",
    fontWeight: "medium",
  },
  title: {
    fontSize: 20,
    lineHeight: "28px",
    fontWeight: "semibold",
  },
  caption: {
    fontSize: 12,
    lineHeight: "16px",
    fontWeight: "normal",
    color: "#71717a",
  },
} satisfies Record<TextVariant, TextNodeProps>;

export type ButtonNodeProps = {
  label?: string;
  disabled?: boolean;
  backgroundColor?: string;
  paddingX?: number;
  paddingY?: number;
  marginX?: number;
  marginY?: number;
  borderRadius?: number;
};

export const defaultButtonProps = {
  label: "Button",
  disabled: false,
  backgroundColor: "#0284c7",
  paddingX: 10,
  paddingY: 5,
  marginX: 0,
  marginY: 0,
  borderRadius: 6,
} satisfies ButtonNodeProps;

export type ImageFit = "contain" | "cover" | "fill" | "none" | "scale-down";

export type ImageNodeProps = {
  assetId?: string;
  width?: CssSize;
  height?: CssSize;
  fit?: ImageFit;
  alt?: string;
  borderRadius?: number;
  backgroundColor?: string;
};

export const defaultImageProps = {
  width: 320,
  height: 180,
  fit: "contain",
  alt: "",
  borderRadius: 0,
  backgroundColor: "#f4f4f5",
} satisfies ImageNodeProps;

export type ChartKind = "line" | "bar";

export type ChartPoint = {
  label: string;
  value: number;
  /** Runtime points carry their original timestamp so multiple series can share one X axis. */
  timestamp?: number;
};

export type ChartNodeProps = {
  title?: string;
  kind?: ChartKind;
  width?: CssSize;
  height?: CssSize;
  minHeight?: CssSize;
  points?: ChartPoint[];
  /** Multi-series chart definition. Series bindings live in UiNode.bindings under series:<id>. */
  series?: ChartSeriesDefinition[];
  color?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  timeRange?: RelativeChartTimeRange;
};

export const defaultChartProps = {
  title: "Trend",
  kind: "line",
  width: "100%",
  minHeight: 240,
  points: [
    { label: "1", value: 20 },
    { label: "2", value: 35 },
    { label: "3", value: 28 },
    { label: "4", value: 44 },
    { label: "5", value: 38 },
  ],
  color: "#0284c7",
  showLegend: false,
  showGrid: true,
  timeRange: DEFAULT_CHART_TIME_RANGE,
} satisfies ChartNodeProps;

export type NavigationNodeProps = {
  backgroundColor?: string;
  color?: string;
  activeColor?: string;
  gap?: number;
  padding?: number;
  borderRadius?: number;
};

export const defaultNavigationProps = {
  backgroundColor: "#ffffff",
  color: "#52525b",
  activeColor: "#7c3aed",
  gap: 4,
  padding: 4,
  borderRadius: 8,
} satisfies NavigationNodeProps;
