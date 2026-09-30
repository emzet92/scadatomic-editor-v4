import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

type TableCellProps = Omit<HTMLAttributes<HTMLDivElement>, "color"> & {
  row?: number;
  column?: number;
  minHeight?: number;
  padding?: number;
  gap?: number;
  backgroundColor?: string;
  horizontalAlign?: "start" | "center" | "end" | "stretch";
  verticalAlign?: "start" | "center" | "end" | "stretch";
  children?: ReactNode;
};

export function TableCell({
  row,
  column,
  minHeight = 48,
  padding = 8,
  gap = 6,
  backgroundColor = "transparent",
  horizontalAlign = "start",
  verticalAlign = "center",
  children,
  style,
  ...domProps
}: TableCellProps) {
  const cellStyle: CSSProperties = {
    minWidth: 0,
    minHeight,
    padding,
    gap,
    display: "flex",
    flexDirection: "column",
    alignItems: mapHorizontal(horizontalAlign),
    justifyContent: mapVertical(verticalAlign),
    backgroundColor,
    borderRight: "var(--scadatomic-table-border-size, 1px) solid var(--scadatomic-table-border-color, #d4d4d8)",
    borderBottom: "var(--scadatomic-table-border-size, 1px) solid var(--scadatomic-table-border-color, #d4d4d8)",
    boxSizing: "border-box",
    ...style,
  };

  return (
    <div
      {...domProps}
      data-table-cell
      data-table-row={row}
      data-table-column={column}
      style={cellStyle}
    >
      {children}
    </div>
  );
}

function mapHorizontal(value: TableCellProps["horizontalAlign"]): CSSProperties["alignItems"] {
  if (value === "start") return "flex-start";
  if (value === "end") return "flex-end";
  return value;
}

function mapVertical(value: TableCellProps["verticalAlign"]): CSSProperties["justifyContent"] {
  if (value === "start") return "flex-start";
  if (value === "end") return "flex-end";
  return value;
}
