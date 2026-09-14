import type { ReactNode } from "react";
import {
  createSpacingTokenRef,
  isSpacingTokenRef,
  resolveSpacingValue,
  type SpacingValue,
} from "../../design-system/spacing";
import { useEditorStore } from "../../editor-store";
import { Select, TextInput } from "../ui";

const LOCAL_OPTION = "__local__";

export function SpacingValueControl({
  label,
  icon,
  value,
  fallback = 0,
  min = 0,
  max,
  step = 1,
  onChange,
  compact = false,
}: {
  label: string;
  icon?: ReactNode;
  value: unknown;
  fallback?: number;
  min?: number;
  max?: number | undefined;
  step?: number;
  onChange: (value: SpacingValue) => void;
  compact?: boolean;
}) {
  const designSystem = useEditorStore((state) => state.document.designSystem);
  const tokens = Object.values(designSystem?.spacing ?? {}).sort((a, b) => {
    if (a.value !== b.value) return a.value - b.value;
    return a.name.localeCompare(b.name);
  });
  const tokenRef = isSpacingTokenRef(value) ? value : undefined;
  const selectedToken = tokenRef ? designSystem?.spacing?.[tokenRef.tokenId] : undefined;
  const resolvedValue = clamp(resolveSpacingValue(value, designSystem, fallback), min, max);
  const selection = tokenRef ? tokenRef.tokenId : LOCAL_OPTION;

  function selectMode(next: string) {
    if (next === LOCAL_OPTION) {
      onChange(resolvedValue);
      return;
    }
    onChange(createSpacingTokenRef(next));
  }

  const content = (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      <Select
        aria-label={`${label} source`}
        value={selection}
        onChange={(event) => selectMode(event.target.value)}
        controlSize={compact ? "sm" : "md"}
      >
        <option value={LOCAL_OPTION}>Local value</option>
        {tokens.length > 0 ? <optgroup label="Design System">{tokens.map((token) => (
          <option key={token.id} value={token.id}>
            {token.name} — {token.value}px
          </option>
        ))}</optgroup> : null}
      </Select>

      {tokenRef ? (
        selectedToken ? (
          <div className="flex min-h-8 items-center justify-between gap-2 rounded-[10px] border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] px-2.5 text-[10px] text-[var(--editor-text-muted)]">
            <span className="truncate">{selectedToken.name}</span>
            <span className="shrink-0 font-mono text-[var(--editor-text)]">{selectedToken.value}px</span>
          </div>
        ) : (
          <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] text-amber-700">
            Missing spacing token. Choose another token or switch to Local value.
          </div>
        )
      ) : (
        <div className="flex items-center gap-1.5">
          <TextInput
            aria-label={`${label} value`}
            controlSize={compact ? "sm" : "md"}
            type="number"
            min={min}
            max={max}
            step={step}
            value={resolvedValue}
            onChange={(event) => onChange(clamp(Number(event.target.value), min, max))}
            className="min-w-0 flex-1"
          />
          <span className="shrink-0 text-[10px] text-[var(--editor-text-soft)]">px</span>
        </div>
      )}

      {tokens.length === 0 && !compact ? (
        <div className="px-1 text-[10px] leading-4 text-[var(--editor-text-soft)]">
          Add values in Design System → Spacing to enable token references.
        </div>
      ) : null}
    </div>
  );

  if (!compact) {
    return (
      <div>
        <div className="mb-1.5 text-xs font-medium text-[var(--editor-text-muted)]">{label}</div>
        {content}
      </div>
    );
  }

  return (
    <div className="rounded-[12px] bg-[var(--editor-surface-muted)] px-2.5 py-2">
      <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[var(--editor-text-muted)]">
        {icon}
        {label}
      </div>
      {content}
    </div>
  );
}

function clamp(value: number, min: number, max: number | undefined) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, max === undefined ? value : Math.min(max, value));
}
