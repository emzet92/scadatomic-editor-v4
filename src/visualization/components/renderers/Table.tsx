import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

type TableProps = Omit<HTMLAttributes<HTMLDivElement>, "color"> & {
  rows?: number;
  columns?: number;
  width?: string | number;
  minWidth?: string | number;
  borderSize?: number;
  borderColor?: string;
  borderRadius?: number;
  backgroundColor?: string;
  children?: ReactNode;
};

export function Table({
  columns = 3,
  width = "100%",
  minWidth = 320,
  borderSize = 1,
  borderColor = "#d4d4d8",
  borderRadius = 8,
  backgroundColor = "#ffffff",
  children,
  style,
  ...domProps
}: TableProps) {
  const safeColumns = Math.max(1, Math.floor(Number(columns) || 1));
  const safeBorderSize = Math.max(0, Number(borderSize) || 0);
  const tableStyle: CSSProperties & Record<`--scadatomic-table-${string}`, string> = {
    width: toCssSize(width),
    minWidth: toCssSize(minWidth),
    display: "grid",
    gridTemplateColumns: `repeat(${safeColumns}, minmax(0, 1fr))`,
    alignItems: "stretch",
    overflow: "hidden",
    boxSizing: "border-box",
    borderTop: safeBorderSize > 0 ? `${safeBorderSize}px solid ${borderColor}` : undefined,
    borderLeft: safeBorderSize > 0 ? `${safeBorderSize}px solid ${borderColor}` : undefined,
    borderRadius,
    backgroundColor,
    "--scadatomic-table-border-size": `${safeBorderSize}px`,
    "--scadatomic-table-border-color": borderColor,
    ...style,
  };

  return (
    <div {...domProps} data-table-grid style={tableStyle}>
      {children}
    </div>
  );
}

function toCssSize(value: string | number | undefined) {
  if (value === undefined) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}
