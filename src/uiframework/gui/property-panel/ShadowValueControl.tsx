import {
  createShadowTokenRef,
  DEFAULT_SHADOW_STYLE,
  isShadowStyle,
  isShadowTokenRef,
  resolveShadowStyle,
  shadowStyleToCss,
  type ShadowStyle,
} from "../../design-system/shadows";
import { useEditorStore } from "../../editor-store";
import { Callout, ColorPickerInput, FormField, Select, TextInput,
  Box,
} from "../ui";

export function ShadowValueControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const designSystem = useEditorStore((state) => state.document.designSystem);
  const tokens = Object.values(designSystem?.shadows ?? {}).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const tokenRef = isShadowTokenRef(value) ? value : undefined;
  const localStyle = isShadowStyle(value) ? value : undefined;
  const selectedToken = tokenRef ? designSystem?.shadows?.[tokenRef.tokenId] : undefined;
  const selection = tokenRef?.tokenId ?? (localStyle ? "__local__" : "__none__");
  const editableStyle = localStyle ?? resolveShadowStyle(value, designSystem, DEFAULT_SHADOW_STYLE);

  function select(next: string) {
    if (next === "__none__") {
      onChange(undefined);
      return;
    }
    if (next === "__local__") {
      onChange({ ...editableStyle });
      return;
    }
    onChange(createShadowTokenRef(next));
  }

  function updateLocal(patch: Partial<ShadowStyle>) {
    onChange({ ...editableStyle, ...patch });
  }

  return (
    <FormField label={label}>
      <Box className="space-y-2">
        <Select value={selection} onChange={(event) => select(event.target.value)}>
          <option value="__none__">None</option>
          <option value="__local__">Local shadow</option>
          {tokens.map((token) => (
            <option key={token.id} value={token.id}>
              {token.name} — {token.y}px / {token.blur}px
            </option>
          ))}
        </Select>

        {localStyle ? (
          <Box className="space-y-2 rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] p-2.5">
            <Box className="grid grid-cols-4 gap-1.5">
              <NumberCell label="X" value={editableStyle.x} onChange={(x) => updateLocal({ x })} />
              <NumberCell label="Y" value={editableStyle.y} onChange={(y) => updateLocal({ y })} />
              <NumberCell label="Blur" min={0} value={editableStyle.blur} onChange={(blur) => updateLocal({ blur: Math.max(0, blur) })} />
              <NumberCell label="Spread" value={editableStyle.spread} onChange={(spread) => updateLocal({ spread })} />
            </Box>
            <ColorPickerInput
              compact
              ariaLabel={`${label} shadow color`}
              value={editableStyle.color}
              onChange={(color) => updateLocal({ color })}
            />
            <Box className="flex h-14 items-center justify-center rounded-lg bg-[var(--editor-canvas-bg)]">
              <Box
                className="h-8 w-20 rounded-lg bg-[var(--editor-surface)]"
                style={{ boxShadow: shadowStyleToCss(editableStyle) }}
              />
            </Box>
          </Box>
        ) : selectedToken ? (
          <Box className="flex h-14 items-center justify-center rounded-xl border border-[var(--editor-border)] bg-[var(--editor-canvas-bg)]">
            <Box
              className="h-8 w-20 rounded-lg bg-[var(--editor-surface)]"
              style={{ boxShadow: shadowStyleToCss(selectedToken) }}
            />
          </Box>
        ) : tokenRef ? (
          <Callout variant="warning" size="sm">
            Missing shadow token. Choose another elevation or switch to Local.
          </Callout>
        ) : null}

        {tokens.length === 0 ? (
          <Box className="px-1 text-[10px] leading-4 text-[var(--editor-text-soft)]">
            Add elevations in Design System → Shadows to enable token references.
          </Box>
        ) : null}
      </Box>
    </FormField>
  );
}

function NumberCell({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min?: number | undefined;
  onChange: (value: number) => void;
}) {
  return (
    <label className="min-w-0">
      <span className="mb-1 block text-[9px] uppercase tracking-wide text-[var(--editor-text-soft)]">{label}</span>
      <TextInput
        controlSize="sm"
        aria-label={`Shadow ${label}`}
        type="number"
        min={min}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
