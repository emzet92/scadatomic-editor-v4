type ContainerProps =
  React.HTMLAttributes<HTMLDivElement> & {
    width?: number;
    height?: number;

    maxWidth?: number;
    minWidth?: number;
    minHeight?: number;

    borderSize?: number;
    padding?: number;
    row?: number;

    children?: React.ReactNode;
  };

export function Container({
  width,
  height,

  maxWidth,
  minWidth,
  minHeight,
  borderSize = 1,
  padding = 8,
  row = 1,

  children,
  ...domProps
}: ContainerProps) {
  return (
    <div
      {...domProps}
      className="container"
      style={{
        ...(domProps.style ?? {}),
        border: `${borderSize}px solid black`,
        borderRadius: 5,
        padding,
        display: "grid",
        gridTemplateColumns: `repeat(${row}, 1fr)`,
        gap: 8,
        width,
        height,
        maxWidth,
        minWidth,
      }}
    >
      {children}
    </div>
  );
}