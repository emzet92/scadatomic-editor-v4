import type { CSSProperties, HTMLAttributes } from "react";

export type ModalProps = HTMLAttributes<HTMLDivElement> & {
  width?: number | string;
  minHeight?: number | string;
  backgroundColor?: string;
  padding?: number;
  gap?: number;
  columns?: number;
  display?: "grid" | "flex";
  border?: string;
  borderRadius?: number;
  shadow?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
};

export function Modal({
  width = 560,
  minHeight = 240,
  backgroundColor = "#ffffff",
  padding = 24,
  gap = 12,
  columns = 1,
  display = "grid",
  border,
  borderRadius = 18,
  shadow,
  closeOnBackdrop = true,
  closeOnEscape = true,
  children,
  style,
  ...props
}: ModalProps) {
  const safeColumns = Math.max(1, Math.floor(columns));
  const modalStyle: CSSProperties = {
    width: toCssSize(width),
    minHeight: toCssSize(minHeight),
    maxWidth: "calc(100vw - 48px)",
    maxHeight: "calc(100vh - 48px)",
    overflow: "auto",
    backgroundColor,
    padding,
    gap,
    display,
    gridTemplateColumns:
      display === "grid" ? `repeat(${safeColumns}, minmax(0, 1fr))` : undefined,
    alignContent: "start",
    alignItems: display === "flex" ? "flex-start" : undefined,
    flexDirection: display === "flex" ? "column" : undefined,
    boxSizing: "border-box",
    position: "relative",
    border,
    borderRadius,
    boxShadow: shadow,
    ...style,
  };

  return (
    <div
      {...props}
      data-scadatomic-modal-root
      data-close-on-backdrop={closeOnBackdrop || undefined}
      data-close-on-escape={closeOnEscape || undefined}
      style={modalStyle}
    >
      {children}
    </div>
  );
}

function toCssSize(value: number | string | undefined) {
  if (value === undefined) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}
