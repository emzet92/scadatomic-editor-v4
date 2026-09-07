import type { ButtonHTMLAttributes } from "react";
import type { ButtonNodeProps } from "../component-props";

export type ButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonNodeProps;

export function Button({
  label,
  backgroundColor,
  className,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      style={{
        ...style,
        backgroundColor: backgroundColor ?? "#0284c7",
      }}
      className={
        className ??
        `
          inline-flex
          items-center
          justify-center
          gap-2
          h-9
          px-4
          rounded-md
          text-white
          text-sm
          font-medium
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
