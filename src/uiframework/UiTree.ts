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

export type UINode =
    | ContainerUINode
    | TextUINode
    | ButtonUINode;

export type UITree = {
    root: NodeId;
    nodes: Record<NodeId, UINode>;
};

//
// Defaults
//

export const defaultPropsByType = {
    Container: defaultContainerProps,
    Text: defaultTextProps,
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