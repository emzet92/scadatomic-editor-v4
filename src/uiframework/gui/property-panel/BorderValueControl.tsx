import {
  borderStyleToCss,
  createBorderTokenRef,
  DEFAULT_BORDER_STYLE,
  isBorderStyle,
  isBorderTokenRef,
  resolveBorderStyle,
  type BorderLineStyle,
  type BorderStyle,
} from "../../design-system/borders";
import { useEditorStore } from "../../editor-store";
import { Callout, ColorPickerInput, FormField, Select, TextInput,
  Box,
} from "../ui";

const BORDER_STYLES: BorderLineStyle[] = ["solid", "dashed", "dotted", "double"];

export function BorderValueControl({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: unknown;
  fallback?: BorderStyle | undefined;
  onChange: (value: unknown) => void;
}) {
  const designSystem = useEditorStore((state) => state.document.designSystem);
  const tokens = Object.values(designSystem?.borders ?? {}).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const tokenRef = isBorderTokenRef(value) ? value : undefined;
  const localStyle = isBorderStyle(value);
  const selectedToken = tokenRef ? designSystem?.borders?.[tokenRef.tokenId] : undefined;
  const selection = tokenRef?.tokenId ?? (localStyle && value.width > 0 ? "__local__" : "__none__");
  const editableStyle = resolveBorderStyle(
    value,
    designSystem,
    fallback ?? DEFAULT_BORDER_STYLE
  );

  function select(next: string) {
    if (next === "__none__") {
      onChange({ ...editableStyle, width: 0 });
      return;
    }
    if (next === "__local__") {
      onChange({
        ...editableStyle,
        width: editableStyle.width > 0 ? editableStyle.width : fallback?.width ?? 1,
      });
      return;
    }
    onChange(createBorderTokenRef(next));
  }

  function updateLocal(patch: Partial<BorderStyle>) {
    onChange({ ...editableStyle, ...patch });
  }

  return (
    <FormField label={label}>
      <Box className="space-y-2">
        <Select value={selection} onChange={(event) => select(event.target.value)}>
          <option value="__none__">None</option>
          <option value="__local__">Local border / stroke</option>
          {tokens.map((token) => (
            <option key={token.id} value={token.id}>
              {token.name} — {token.width}px {token.style}
            </option>
          ))}
        </Select>

        {selection === "__local__" ? (
          <Box className="space-y-2 rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] p-2.5">
            <Box className="grid grid-cols-2 gap-2">
              <label className="min-w-0">
                <span className="mb-1 block text-[9px] uppercase tracking-wide text-[var(--editor-text-soft)]">Width</span>
                <TextInput
                  controlSize="sm"
                  aria-label={`${label} width`}
                  type="number"
                  min={0}
                  step={1}
                  value={editableStyle.width}
                  onChange={(event) =>
                    updateLocal({ width: Math.max(0, Number(event.target.value)) })
                  }
                />
              </label>
              <label className="min-w-0">
                <span className="mb-1 block text-[9px] uppercase tracking-wide text-[var(--editor-text-soft)]">Style</span>
                <Select
                  aria-label={`${label} style`}
                  value={editableStyle.style}
                  onChange={(event) =>
                    updateLocal({ style: event.target.value as BorderLineStyle })
                  }
                >
                  {BORDER_STYLES.map((style) => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </Select>
              </label>
            </Box>
            <ColorPickerInput
              compact
              ariaLabel={`${label} color`}
              value={editableStyle.color}
              onChange={(color) => updateLocal({ color })}
            />
            <BorderPreview style={editableStyle} />
          </Box>
        ) : selectedToken ? (
          <BorderPreview style={selectedToken} />
        ) : tokenRef ? (
          <Callout variant="warning" size="sm">
            Missing border token. Choose another stroke or switch to Local.
          </Callout>
        ) : null}

        {tokens.length === 0 ? (
          <Box className="px-1 text-[10px] leading-4 text-[var(--editor-text-soft)]">
            Add styles in Design System → Borders to enable token references.
          </Box>
        ) : null}
      </Box>
    </FormField>
  );
}

function BorderPreview({ style }: { style: BorderStyle }) {
  return (
    <Box className="flex h-14 items-center justify-center rounded-lg bg-[var(--editor-canvas-bg)]">
      <Box
        className="h-8 w-24 rounded-lg bg-[var(--editor-surface)]"
        style={{ border: borderStyleToCss(style), boxSizing: "border-box" }}
      />
    </Box>
  );
}
