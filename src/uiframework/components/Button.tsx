import type { ButtonHTMLAttributes } from "react";
import {
  defaultButtonProps,
  type ButtonNodeProps,
} from "../component-props";

export type ButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonNodeProps;

export function Button({
  label,
  backgroundColor,
  paddingX = defaultButtonProps.paddingX,
  paddingY = defaultButtonProps.paddingY,
  marginX = defaultButtonProps.marginX,
  marginY = defaultButtonProps.marginY,
  borderRadius = defaultButtonProps.borderRadius,
  className,
  style,
  ...props
}: ButtonProps) {
  const safePaddingX = clampSpacing(paddingX, 0, 64);
  const safePaddingY = clampSpacing(paddingY, 0, 48);
  const safeMarginX = clampSpacing(marginX, 0, 64);
  const safeMarginY = clampSpacing(marginY, 0, 64);
  const safeRadius = clampSpacing(borderRadius, 0, 64);

  return (
    <button
      {...props}
      style={{
        ...style,
        backgroundColor: backgroundColor ?? defaultButtonProps.backgroundColor,
        paddingInline: safePaddingX,
        paddingBlock: safePaddingY,
        marginInline: safeMarginX,
        marginBlock: safeMarginY,
        borderRadius: safeRadius,
        boxSizing: "border-box",
      }}
      className={
        className ??
        `
          inline-flex
          min-h-8
          items-center
          justify-center
          gap-1.5
          text-white
          text-sm
          font-medium
          leading-5
          transition-colors
          disabled:opacity-50
          disabled:pointer-events-none
        `
      }
    >
      {String(label ?? "Button")}
    </button>
  );
}

function clampSpacing(value: number | undefined, min: number, max: number) {
  const resolved = typeof value === "number" && Number.isFinite(value) ? value : min;
  return Math.max(min, Math.min(max, resolved));
}
