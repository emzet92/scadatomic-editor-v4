import { Minus, Plus } from "lucide-react";
import { IconButton } from "./Button";
import { cx } from "./cx";

export function Stepper({
  value,
  suffix,
  onDecrease,
  onIncrease,
  decreaseLabel = "Decrease",
  increaseLabel = "Increase",
  className,
}: {
  value: string | number;
  suffix?: string | undefined;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseLabel?: string | undefined;
  increaseLabel?: string | undefined;
  className?: string | undefined;
}) {
  return (
    <div className={cx("flex h-9 shrink-0 items-center rounded-full border border-[var(--editor-border)] bg-[var(--editor-surface)] p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)]", className)}>
      <IconButton aria-label={decreaseLabel} size="icon-xs" className="rounded-full" onClick={onDecrease}>
        <Minus size={12} />
      </IconButton>
      <div className="min-w-12 px-1 text-center text-[11px] font-semibold tabular-nums text-[var(--editor-text)]">
        {value}{suffix ?? ""}
      </div>
      <IconButton aria-label={increaseLabel} size="icon-xs" className="rounded-full" onClick={onIncrease}>
        <Plus size={12} />
      </IconButton>
    </div>
  );
}
