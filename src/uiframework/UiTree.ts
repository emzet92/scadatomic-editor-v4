export type NodeId = string;

export type CssSize =
  | number
  | string;

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

export type TextNodeProps =
  Record<string, any>;

export type ButtonNodeProps =
  Record<string, any>;

export type BaseUINode<
  TType extends string,
  TProps extends Record<string, any>
> = {
  id: NodeId;
  type: TType;
  props: TProps;

  // parent: NodeId | null
  children: NodeId[];
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

export const defaultPropsByType = {
  Container: defaultContainerProps,
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