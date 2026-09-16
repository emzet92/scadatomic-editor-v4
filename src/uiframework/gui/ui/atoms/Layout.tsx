import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "../utils/cx";

export type LayoutGap = "none" | "xs" | "sm" | "md" | "lg" | "xl";
export type LayoutAlign = "start" | "center" | "end" | "stretch" | "baseline";
export type LayoutJustify = "start" | "center" | "end" | "between" | "around";

const gapClassNames: Record<LayoutGap, string> = {
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
  xl: "gap-6",
};

const alignClassNames: Record<LayoutAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

const justifyClassNames: Record<LayoutJustify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
};

export type BoxProps = HTMLAttributes<HTMLDivElement>;

export const Box = forwardRef<HTMLDivElement, BoxProps>(function Box({ className, ...props }, ref) {
  return <div ref={ref} className={className} {...props} />;
});

export type StackProps = BoxProps & {
  gap?: LayoutGap | undefined;
  align?: LayoutAlign | undefined;
};

export function Stack({ gap = "md", align = "stretch", className, ...props }: StackProps) {
  return (
    <div
      className={cx("flex flex-col", gapClassNames[gap], alignClassNames[align], className)}
      {...props}
    />
  );
}

export type InlineProps = BoxProps & {
  gap?: LayoutGap | undefined;
  align?: LayoutAlign | undefined;
  justify?: LayoutJustify | undefined;
  wrap?: boolean | undefined;
};

export function Inline({
  gap = "sm",
  align = "center",
  justify = "start",
  wrap = false,
  className,
  ...props
}: InlineProps) {
  return (
    <div
      className={cx(
        "flex",
        gapClassNames[gap],
        alignClassNames[align],
        justifyClassNames[justify],
        wrap && "flex-wrap",
        className
      )}
      {...props}
    />
  );
}

export type GridProps = BoxProps & {
  gap?: LayoutGap | undefined;
};

export function Grid({ gap = "md", className, ...props }: GridProps) {
  return <div className={cx("grid", gapClassNames[gap], className)} {...props} />;
}

export function Center({ className, ...props }: BoxProps) {
  return <div className={cx("flex items-center justify-center", className)} {...props} />;
}

export function Spacer({ className, ...props }: BoxProps) {
  return <div aria-hidden="true" className={cx("min-w-0 flex-1", className)} {...props} />;
}

export function Slot({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
