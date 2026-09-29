import type { CSSProperties, HTMLAttributes } from "react";
import type { CssSize, PageNodeProps } from "../component-props";

export type PageProps =
  Omit<HTMLAttributes<HTMLDivElement>, "color"> &
  PageNodeProps;

export function Page({
  deviceMode = "desktop",
  width = 1440,
  height = 900,
  backgroundColor = "#ffffff",
  padding = 24,
  gap = 12,
  columns = 1,
  display = "grid",
  embeddedInLayout = false,
  children,
  style,
  className,
  ...domProps
}: PageProps) {
  const safeColumns = Math.max(1, Math.floor(columns));

  const pageStyle: CSSProperties = {
    width: embeddedInLayout ? "100%" : toCssSize(width),
    height: embeddedInLayout ? "auto" : toCssSize(height),
    minHeight: embeddedInLayout ? 0 : toCssSize(height),
    backgroundColor,
    padding,
    display,
    gap,
    gridTemplateColumns:
      display === "grid"
        ? `repeat(${safeColumns}, minmax(0, 1fr))`
        : undefined,
    alignContent: "start",
    alignItems: display === "flex" ? "flex-start" : undefined,
    flexDirection: display === "flex" ? "column" : undefined,
    boxSizing: "border-box",
    position: "relative",
    ...style,
  };

  return (
    <div
      {...domProps}
      data-page-mode={deviceMode}
      data-page-embedded={embeddedInLayout || undefined}
      className={className}
      style={pageStyle}
    >
      {children}
    </div>
  );
}

function toCssSize(value: CssSize | undefined): CSSProperties["width"] {
  if (value === undefined) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}
