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
  borderSize?: number;
  display?: "grid" | "flex";
};

export const defaultContainerProps = {
  width: "100%",
  minHeight: 80,
  padding: 8,
  gap: 8,
  columns: 1,
  borderSize: 1,
  display: "grid",
} satisfies ContainerNodeProps;

export type TextAlign = "left" | "center" | "right";
export type TextWeight = "normal" | "medium" | "semibold" | "bold";
export type TextVariant = "body" | "label" | "title" | "caption";

export type TextNodeProps = {
  value?: string | number;
  color?: string;
  fontSize?: number;
  lineHeight?: CssSize;
  fontWeight?: TextWeight;
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
};

export const defaultButtonProps = {
  label: "Button",
  disabled: false,
  backgroundColor: "#0284c7",
} satisfies ButtonNodeProps;

export type ChartKind = "line" | "bar";

export type ChartPoint = {
  label: string;
  value: number;
};

export type ChartNodeProps = {
  title?: string;
  kind?: ChartKind;
  width?: CssSize;
  height?: CssSize;
  minHeight?: CssSize;
  points?: ChartPoint[];
  color?: string;
  showLegend?: boolean;
  showGrid?: boolean;
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
