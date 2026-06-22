type TextProps =
  React.HTMLAttributes<HTMLSpanElement> & {
    value?: unknown;
    color?: string;
  };

export function Text({
  value,
  color,
  style,
  ...props
}: TextProps) {
  return (
    <span
      {...props}
      style={{
        ...style,
        color,
      }}
    >
      {String(value ?? "")}
    </span>
  );
}