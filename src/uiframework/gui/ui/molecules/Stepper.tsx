import { Minus, Plus } from "lucide-react";
import { IconButton } from "../atoms/Button";
import { Icon } from "../atoms/Icon";
import { Inline } from "../atoms/Layout";
import { Text } from "../atoms/Typography";
import { cx } from "../utils/cx";

export type StepperProps = {
  value: string | number;
  suffix?: string | undefined;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseLabel?: string | undefined;
  increaseLabel?: string | undefined;
  className?: string | undefined;
};

export function Stepper({
  value,
  suffix,
  onDecrease,
  onIncrease,
  decreaseLabel = "Decrease",
  increaseLabel = "Increase",
  className,
}: StepperProps) {
  return (
    <Inline
      gap="none"
      className={cx(
        "h-9 shrink-0 rounded-full border border-[var(--editor-border)] bg-[var(--editor-surface)] p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className
      )}
    >
      <IconButton aria-label={decreaseLabel} size="icon-xs" className="rounded-full" onClick={onDecrease}>
        <Icon glyph={Minus} size={12} />
      </IconButton>
      <Text as="div" variant="caption" className="min-w-12 px-1 text-center font-semibold tabular-nums">
        {value}{suffix ?? ""}
      </Text>
      <IconButton aria-label={increaseLabel} size="icon-xs" className="rounded-full" onClick={onIncrease}>
        <Icon glyph={Plus} size={12} />
      </IconButton>
    </Inline>
  );
}
