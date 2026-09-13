import type { CSSProperties, HTMLAttributes } from "react";
import {
  defaultContainerProps,
  type ContainerNodeProps,
  type CssSize,
} from "../component-props";

export type ContainerProps =
  Omit<HTMLAttributes<HTMLDivElement>, "color"> &
  ContainerNodeProps;

export function Container({
  width = "100%",
  height,
  minWidth,
  minHeight = defaultContainerProps.minHeight,
  maxWidth,
  maxHeight,
  borderSize = defaultContainerProps.borderSize,
  padding = defaultContainerProps.padding,
  gap = defaultContainerProps.gap,
  columns = defaultContainerProps.columns,
  gridMode = defaultContainerProps.gridMode,
  minColumnWidth = defaultContainerProps.minColumnWidth,
  minRowHeight = defaultContainerProps.minRowHeight,
  display = defaultContainerProps.display,
  children,
  style,
  className,
  ...domProps
}: ContainerProps) {
  const safeColumns = Math.max(1, Math.floor(columns));
  const safeMinColumnWidth = Math.max(96, Math.floor(minColumnWidth));
  const safeMinRowHeight = Math.max(24, Math.floor(minRowHeight));
  const isGrid = display === "grid";

  const layoutStyle: CSSProperties = {
    width: toCssSize(width),
    height: toCssSize(height),
    minWidth: toCssSize(minWidth),
    minHeight: toCssSize(minHeight),
    maxWidth: toCssSize(maxWidth),
    maxHeight: toCssSize(maxHeight),
    border: borderSize > 0 ? `${borderSize}px solid #d4d4d8` : undefined,
    borderRadius: 8,
    padding,
    display,
    gap,
    gridTemplateColumns: isGrid
      ? gridMode === "adaptive"
        ? `repeat(auto-fit, minmax(min(100%, ${safeMinColumnWidth}px), 1fr))`
        : `repeat(${safeColumns}, minmax(0, 1fr))`
      : undefined,
    gridAutoRows: isGrid ? `minmax(${safeMinRowHeight}px, max-content)` : undefined,
    gridAutoFlow: isGrid ? "row" : undefined,
    alignContent: isGrid ? "start" : undefined,
    alignItems: display === "flex" ? "center" : isGrid ? "stretch" : undefined,
    justifyItems: isGrid ? "stretch" : undefined,
    flexWrap: display === "flex" ? "wrap" : undefined,
    boxSizing: "border-box",
    ...style,
  };

  const layoutClassName = [
    className,
    isGrid ? "scadatomic-grid-layout" : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      {...domProps}
      data-layout-kind={isGrid ? "grid" : "flex"}
      data-grid-mode={isGrid ? gridMode : undefined}
      className={layoutClassName || undefined}
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
