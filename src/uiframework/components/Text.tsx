import type {
  CSSProperties,
  HTMLAttributes,
} from "react";
import { defaultTextProps, defaultTextPropsByVariant, type TextNodeProps } from "../component-props";



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

  color,
  textStyle,
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight,
  letterSpacing,
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

  const variantDefaults: TextNodeProps =
    defaultTextPropsByVariant[resolvedVariant];
  const resolvedFontFamily = textStyle?.fontFamily ?? fontFamily;
  const resolvedLetterSpacing = textStyle?.letterSpacing ?? letterSpacing;

  const resolvedProps: TextNodeProps = {
    ...defaultTextProps,
    ...variantDefaults,

    value:
      value ?? defaultTextProps.value,

    color:
      color ??
      variantDefaults.color ??
      defaultTextProps.color,

    ...(resolvedFontFamily !== undefined ? { fontFamily: resolvedFontFamily } : {}),

    fontSize:
      textStyle?.fontSize ??
      fontSize ??
      variantDefaults.fontSize ??
      defaultTextProps.fontSize,

    lineHeight:
      textStyle?.lineHeight ??
      lineHeight ??
      variantDefaults.lineHeight ??
      defaultTextProps.lineHeight,

    fontWeight:
      textStyle?.fontWeight ??
      fontWeight ??
      variantDefaults.fontWeight ??
      defaultTextProps.fontWeight,

    ...(resolvedLetterSpacing !== undefined ? { letterSpacing: resolvedLetterSpacing } : {}),

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

        fontFamily:
          resolvedProps.fontFamily,

        fontSize:
          resolvedProps.fontSize,

        lineHeight:
          resolvedProps.lineHeight,

        letterSpacing:
          resolvedProps.letterSpacing,

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