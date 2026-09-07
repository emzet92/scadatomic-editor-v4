import type { CSSProperties, HTMLAttributes } from "react";
import type { ContainerNodeProps, CssSize } from "../component-props";

export type ContainerProps =
  Omit<HTMLAttributes<HTMLDivElement>, "color"> &
  ContainerNodeProps;

export function Container({
  width = "100%",
  height,
  minWidth,
  minHeight = 80,
  maxWidth,
  maxHeight,
  borderSize = 1,
  padding = 8,
  gap = 8,
  columns = 1,
  display = "grid",
  children,
  style,
  className,
  ...domProps
}: ContainerProps) {
  const safeColumns = Math.max(1, Math.floor(columns));

  const layoutStyle: CSSProperties = {
    width: toCssSize(width),
    height: toCssSize(height),
    minWidth: toCssSize(minWidth),
    minHeight: toCssSize(minHeight),
    maxWidth: toCssSize(maxWidth),
    maxHeight: toCssSize(maxHeight),
    border: borderSize > 0 ? `${borderSize}px solid #d4d4d8` : undefined,
    borderRadius: 5,
    padding,
    display,
    gap,
    gridTemplateColumns:
      display === "grid"
        ? `repeat(${safeColumns}, minmax(0, 1fr))`
        : undefined,
    alignItems: display === "flex" ? "center" : undefined,
    flexWrap: display === "flex" ? "wrap" : undefined,
    boxSizing: "border-box",
    ...style,
  };

  return (
    <div
      {...domProps}
      className={className}
      style={layoutStyle}
    >
      {children}
    </div>
  );
}

function toCssSize(value: CssSize | undefined): CSSProperties["width"] {
  if (value === undefined) {
    return undefined;
  }

  return typeof value === "number" ? `${value}px` : value;
}
