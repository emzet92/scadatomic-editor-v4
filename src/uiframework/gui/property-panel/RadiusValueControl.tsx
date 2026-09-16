import type { ReactNode } from "react";
import {
  createRadiusTokenRef,
  isRadiusTokenRef,
  resolveRadiusValue,
  type RadiusValue,
} from "../../design-system/radius";
import { useEditorStore } from "../../editor-store";
import { Callout, Select, TextInput,
  Box,
} from "../ui";

const LOCAL_OPTION = "__local__";

export function RadiusValueControl({
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
  onChange: (value: RadiusValue) => void;
  compact?: boolean;
}) {
  const designSystem = useEditorStore((state) => state.document.designSystem);
  const tokens = Object.values(designSystem?.radius ?? {}).sort((a, b) => {
    if (a.value !== b.value) return a.value - b.value;
    return a.name.localeCompare(b.name);
  });
  const tokenRef = isRadiusTokenRef(value) ? value : undefined;
  const selectedToken = tokenRef ? designSystem?.radius?.[tokenRef.tokenId] : undefined;
  const resolvedValue = clamp(resolveRadiusValue(value, designSystem, fallback), min, max);
  const selection = tokenRef ? tokenRef.tokenId : LOCAL_OPTION;

  function selectMode(next: string) {
    if (next === LOCAL_OPTION) {
      onChange(resolvedValue);
      return;
    }
    onChange(createRadiusTokenRef(next));
  }

  const content = (
    <Box className={compact ? "space-y-1.5" : "space-y-2"}>
      <Select
        aria-label={`${label} source`}
        value={selection}
        onChange={(event) => selectMode(event.target.value)}
        controlSize={compact ? "sm" : "md"}
      >
        <option value={LOCAL_OPTION}>Local value</option>
        {tokens.length > 0 ? (
          <optgroup label="Design System">
            {tokens.map((token) => (
              <option key={token.id} value={token.id}>
                {token.name} — {token.value}px
              </option>
            ))}
          </optgroup>
        ) : null}
      </Select>

      {tokenRef ? (
        selectedToken ? (
          <Box className="flex min-h-8 items-center justify-between gap-2 rounded-[10px] border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] px-2.5 text-[10px] text-[var(--editor-text-muted)]">
            <span className="truncate">{selectedToken.name}</span>
            <span className="shrink-0 font-mono text-[var(--editor-text)]">{selectedToken.value}px</span>
          </Box>
        ) : (
          <Callout variant="warning" size="sm">
            Missing radius token. Choose another token or switch to Local value.
          </Callout>
        )
      ) : (
        <Box className="flex items-center gap-1.5">
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
        </Box>
      )}

      {tokens.length === 0 && !compact ? (
        <Box className="px-1 text-[10px] leading-4 text-[var(--editor-text-soft)]">
          Add values in Design System → Radius to enable token references.
        </Box>
      ) : null}
    </Box>
  );

  if (!compact) {
    return (
      <Box>
        <Box className="mb-1.5 text-xs font-medium text-[var(--editor-text-muted)]">{label}</Box>
        {content}
      </Box>
    );
  }

  return (
    <Box className="rounded-[12px] bg-[var(--editor-surface-muted)] px-2.5 py-2">
      <Box className="mb-1.5 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[var(--editor-text-muted)]">
        {icon}
        {label}
      </Box>
      {content}
    </Box>
  );
}

function clamp(value: number, min: number, max: number | undefined) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, max === undefined ? value : Math.min(max, value));
}
