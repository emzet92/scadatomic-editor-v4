import type { HTMLAttributes } from "react";
import { cx } from "../utils/cx";

export type DividerProps = HTMLAttributes<HTMLHRElement> & {
  orientation?: "horizontal" | "vertical" | undefined;
  strong?: boolean | undefined;
};

export function Divider({ orientation = "horizontal", strong = false, className, ...props }: DividerProps) {
  return (
    <hr
      aria-orientation={orientation}
      className={cx(
        "m-0 shrink-0 border-0",
        strong ? "bg-[var(--editor-border-strong)]" : "bg-[var(--editor-border)]",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px self-stretch",
        className
      )}
      {...props}
    />
  );
}
