import { Children, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";

export type PageSlotProps = HTMLAttributes<HTMLDivElement> & {
  slotName?: string;
  children?: ReactNode;
};

export function EditorPageSlot({
  slotName = "content",
  children,
  style,
  ...props
}: PageSlotProps) {
  const filled = Children.count(children) > 0;
  const slotStyle: CSSProperties = {
    width: "100%",
    minWidth: 0,
    minHeight: filled ? 0 : 120,
    border: filled ? "none" : "1px dashed #a78bfa",
    borderRadius: filled ? 0 : 8,
    background: filled ? "transparent" : "rgba(245,243,255,.55)",
    position: "relative",
    boxSizing: "border-box",
    ...style,
  };

  return (
    <div {...props} style={slotStyle} data-page-slot={slotName}>
      {!filled ? (
      <div
        data-editor-ignore
        style={{
          position: "absolute",
          top: 6,
          right: 8,
          zIndex: 2,
          padding: "2px 6px",
          borderRadius: 4,
          background: "#ede9fe",
          color: "#6d28d9",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: ".06em",
          textTransform: "uppercase",
          pointerEvents: "none",
        }}
      >
        slot · {slotName}
      </div>
      ) : null}
      {children}
    </div>
  );
}

export function RuntimePageSlot({
  slotName = "content",
  children,
  style,
  ...props
}: PageSlotProps) {
  return (
    <div
      {...props}
      data-page-slot={slotName}
      style={{ width: "100%", minWidth: 0, minHeight: 0, ...style }}
    >
      {children}
    </div>
  );
}
