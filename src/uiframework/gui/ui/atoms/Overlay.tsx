import type { HTMLAttributes } from "react";
import { cx } from "../utils/cx";

export type OverlayTone = "scrim" | "soft" | "accent";

const toneClassNames: Record<OverlayTone, string> = {
  scrim: "bg-black/35 backdrop-blur-[1px]",
  soft: "bg-black/15",
  accent: "bg-[var(--editor-accent-soft)]/90",
};

export type OverlayProps = HTMLAttributes<HTMLDivElement> & {
  tone?: OverlayTone | undefined;
  fixed?: boolean | undefined;
  center?: boolean | undefined;
};

export function Overlay({ tone = "scrim", fixed = false, center = false, className, ...props }: OverlayProps) {
  return (
    <div
      className={cx(
        fixed ? "fixed inset-0" : "absolute inset-0",
        toneClassNames[tone],
        center && "flex items-center justify-center",
        className
      )}
      {...props}
    />
  );
}
