import type { ChangeEvent } from "react";
import { Inline } from "../atoms/Layout";
import { TextInput } from "../atoms/FormControls";
import { cx } from "../utils/cx";

export type ColorPickerInputProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string | undefined;
  compact?: boolean | undefined;
  className?: string | undefined;
  showValue?: boolean | undefined;
};

export function ColorPickerInput({
  value,
  onChange,
  ariaLabel = "Choose color",
  compact = false,
  className,
  showValue = true,
}: ColorPickerInputProps) {
  const nativeValue = normalizeNativeColor(value);

  function handleNativeChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  return (
    <Inline className={cx("min-w-0", className)}>
      <label
        className={cx(
          "relative shrink-0 cursor-pointer overflow-hidden border border-[var(--editor-border)] bg-[var(--editor-surface)] shadow-sm transition hover:border-[var(--editor-accent-border)] focus-within:ring-2 focus-within:ring-[var(--editor-accent-soft)]",
          compact ? "h-8 w-10 rounded-[10px]" : "h-9 w-12 rounded-[12px]"
        )}
        title="Open color picker"
      >
        <span className="absolute inset-1 rounded-[8px] border border-black/10" style={{ background: value || nativeValue }} />
        <input
          data-editor-ignore
          type="color"
          aria-label={ariaLabel}
          value={nativeValue}
          onChange={handleNativeChange}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
      {showValue ? (
        <TextInput
          controlSize={compact ? "sm" : "md"}
          mono
          aria-label={`${ariaLabel} value`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1"
        />
      ) : null}
    </Inline>
  );
}

const namedColors: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#ef4444",
  green: "#22c55e",
  blue: "#3b82f6",
  yellow: "#eab308",
  gray: "#71717a",
  zinc: "#71717a",
};

function normalizeNativeColor(value: string, fallback = "#18181b") {
  const trimmed = value.trim();
  const named = namedColors[trimmed.toLowerCase()];
  if (named) return named;
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
  }
  return fallback;
}
