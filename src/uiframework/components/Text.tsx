import type {
  CSSProperties,
  HTMLAttributes,
} from "react";
import { defaultTextProps, defaultTextPropsByVariant, type TextNodeProps } from "../UiTree";



type TextProps =
  HTMLAttributes<HTMLSpanElement> &
  TextNodeProps;

type TextWeight =
  NonNullable<TextNodeProps["fontWeight"]>;

const fontWeightMap: Record<
  TextWeight,
  CSSProperties["fontWeight"]
> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

export function Text({
  value,

  tag,

  color,
  fontSize,
  lineHeight,
  fontWeight,
  align,
  variant,

  italic,
  underline,
  uppercase,

  borderSize,
  borderColor,
  borderRadius,

  style,
  ...domProps
}: TextProps) {
  const resolvedVariant =
    variant ?? defaultTextProps.variant ?? "body";

  const variantDefaults =
    defaultTextPropsByVariant[
    resolvedVariant
    ];

  const resolvedProps: TextNodeProps = {
    ...defaultTextProps,
    ...variantDefaults,

    value:
      value ?? defaultTextProps.value,

    tag,

    color:
      color ??
      variantDefaults.color ??
      defaultTextProps.color,

    fontSize:
      fontSize ??
      variantDefaults.fontSize ??
      defaultTextProps.fontSize,

    lineHeight:
      lineHeight ??
      variantDefaults.lineHeight ??
      defaultTextProps.lineHeight,

    fontWeight:
      fontWeight ??
      variantDefaults.fontWeight ??
      defaultTextProps.fontWeight,

    align:
      align ??
      defaultTextProps.align,

    variant:
      resolvedVariant,

    italic:
      italic ??
      defaultTextProps.italic,

    underline:
      underline ??
      defaultTextProps.underline,

    uppercase:
      uppercase ??
      defaultTextProps.uppercase,

    borderSize:
      borderSize ??
      defaultTextProps.borderSize,

    borderColor:
      borderColor ??
      defaultTextProps.borderColor,

    borderRadius:
      borderRadius ??
      defaultTextProps.borderRadius,
  };

  const hasBorder =
    typeof resolvedProps.borderSize === "number" &&
    resolvedProps.borderSize > 0;

  return (
    <span
      {...domProps}
      style={{
        ...style,

        display: "block",

        color:
          resolvedProps.color,

        fontSize:
          resolvedProps.fontSize,

        lineHeight:
          resolvedProps.lineHeight,

        fontWeight:
          resolvedProps.fontWeight
            ? fontWeightMap[
            resolvedProps.fontWeight
            ]
            : undefined,

        textAlign:
          resolvedProps.align,

        fontStyle:
          resolvedProps.italic
            ? "italic"
            : undefined,

        textDecoration:
          resolvedProps.underline
            ? "underline"
            : undefined,

        textTransform:
          resolvedProps.uppercase
            ? "uppercase"
            : undefined,

        border:
          hasBorder
            ? `${resolvedProps.borderSize}px solid ${resolvedProps.borderColor}`
            : undefined,

        borderRadius:
          resolvedProps.borderRadius,

        padding:
          hasBorder
            ? "4px 6px"
            : undefined,
      }}
    >
      {String(resolvedProps.value ?? "")}
    </span>
  );
}