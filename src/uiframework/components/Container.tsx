type ContainerProps =
  React.HTMLAttributes<HTMLDivElement> & {
    maxWidth?: number;
    borderSize?: number;
    padding?: string;
    row?: number;
    children?: React.ReactNode;
  };

export function Container({
  maxWidth = 800,
  borderSize = 1,
  padding = "8px",
  row = 1,
  children,
  ...domProps
}: ContainerProps) {
  return (
    <div
      {...domProps}
      className="container"
      style={{
        border: `${borderSize}px solid black`,
        borderRadius: 5,
        padding: `${padding}px`,
        display: "grid",
        gridTemplateColumns: `repeat(${row}, 1fr)`,
        gap: 8,
        maxWidth,
      }}
    >
      {children}
    </div>
  );
}