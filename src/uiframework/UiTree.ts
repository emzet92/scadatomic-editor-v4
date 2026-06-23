export type NodeId = string;

export type CssSize =
    | number
    | string;

//
// Container
//

export type ContainerNodeProps = {
    width?: CssSize;
    height?: CssSize;

    minWidth?: CssSize;
    minHeight?: CssSize;

    maxWidth?: CssSize;
    maxHeight?: CssSize;

    padding?: number;
    gap?: number;
    row?: number;

    borderSize?: number;

    display?:
    | "grid"
    | "flex";
};

export const defaultContainerProps = {
    width: "100%",
    minHeight: 80,
    padding: 8,
    gap: 8,
    row: 1,
    borderSize: 1,
    display: "grid",
} satisfies ContainerNodeProps;

//
// Text
//


export type TextAlign =
    | "left"
    | "center"
    | "right";

export type TextWeight =
    | "normal"
    | "medium"
    | "semibold"
    | "bold";

export type TextVariant =
    | "body"
    | "label"
    | "title"
    | "caption";

export type TextNodeProps = {
    value?: string | number;

    tag?: string;

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

//
// Button
//

export type ButtonNodeProps =
    Record<string, any>;

//
// Base node
//

export type BaseUINode<
    TType extends string,
    TProps extends Record<string, any>
> = {
    id: NodeId;
    type: TType;
    props: TProps;

    // parent: NodeId | null
    children?: NodeId[];
};

export type ContainerUINode =
    BaseUINode<
        "Container",
        ContainerNodeProps
    >;

export type TextUINode =
    BaseUINode<
        "Text",
        TextNodeProps
    >;

export type ButtonUINode =
    BaseUINode<
        "Button",
        ButtonNodeProps
    >;

export type ChartUiNode =
    BaseUINode<
        "Chart",
        ChartNodeProps
    >;

export type UINode =
    | ContainerUINode
    | TextUINode
    | ButtonUINode
    | ChartUiNode;

export type UITree = {
    root: NodeId;
    nodes: Record<NodeId, UINode>;
};


//
// Chart
//

export type ChartKind =
    | "line"
    | "bar";

export type ChartPoint = {
    label: string;
    value: number;
};

export type ChartNodeProps = {
    title?: string;

    kind?: ChartKind;

    tag?: string;

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
    tag: "",
    width: "100%",
    minHeight: 240,
    points: [
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
    ],
    color: "#0284c7",
    showLegend: false,
    showGrid: true,
} satisfies ChartNodeProps;

//
// Defaults
//

export const defaultPropsByType = {
    Container: defaultContainerProps,
    Text: defaultTextProps,
    Chart: defaultChartProps
} as const;

export function getDefaultPropsForType(
    type: string
): Record<string, unknown> {
    return {
        ...(
            defaultPropsByType[
            type as keyof typeof defaultPropsByType
            ] ?? {}
        ),
    };
}


