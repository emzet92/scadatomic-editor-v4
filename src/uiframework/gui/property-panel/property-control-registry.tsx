import type { ReactNode } from "react";
import type { Binding, ComponentInputDefinition } from "../../core/document";
import type { InspectorControl } from "../../registry/component-definitions";
import { useEditorStore } from "../../editor-store";
import {
  createColorTokenRef,
  createSemanticColorTokenRef,
  isColorTokenRef,
  isSemanticColorTokenRef,
  resolveColorValue,
} from "../../design-system/colors";
import {
  createTypographyTokenRef,
  DEFAULT_TYPOGRAPHY_STYLE,
  isTypographyStyle,
  isTypographyTokenRef,
  resolveTypographyValue,
  type TypographyStyle,
  type TypographyWeight,
} from "../../design-system/typography";
import { createTagRef, isTagRef } from "../../data/collections/TagRef";
import { isUdtTag } from "../../data/tags/TagDefinition";
import {
  CHART_TIME_RANGE_PRESETS,
  createRelativeChartTimeRange,
  getChartTimeRangeDurationMs,
} from "../../chart-time-range";
import type { UpdateNode } from "./property-panel-types";
import { ChartSeriesInput } from "./ChartSeriesInput";
import { SpacingValueControl } from "./SpacingValueControl";
import { RadiusValueControl } from "./RadiusValueControl";
import { ShadowValueControl } from "./ShadowValueControl";
import { BorderValueControl } from "./BorderValueControl";
import { ImageAssetPicker } from "../assets/ImageAssetPicker";
import {
  Checkbox,
  ColorPickerInput,
  FormField,
  SectionHeader,
  SegmentedControl,
  SegmentedControlItem,
  Select,
  TextInput,
  Box,
} from "../ui";

export type PropertyControlRendererProps = {
  nodeId: string;
  propName: string;
  value: unknown;
  values: Record<string, unknown>;
  bindings?: Record<string, Binding> | undefined;
  componentInputs?: Record<string, ComponentInputDefinition> | undefined;
  control: InspectorControl;
  updateNode: UpdateNode;
  updateProp: (value: unknown) => void;
};

type PropertyControlRenderer = (props: PropertyControlRendererProps) => ReactNode;



const renderers: Partial<Record<InspectorControl["kind"], PropertyControlRenderer>> = {
  "tag-ref": (props) => <TagRefControl {...props} />,
  "chart-series": (props) => <ChartSeriesControl {...props} />,
  "time-range": (props) => <TimeRangeControl {...props} />,
  "image-asset": (props) => <ImageAssetControl {...props} />,
  typography: (props) => <TypographyControl {...props} />,
  "text-format": (props) => <TextFormatControl {...props} />,
  "text-align": (props) => <TextAlignControl {...props} />,
  "border-size": (props) => <BorderSizeControl {...props} />,
  color: (props) => <ColorControl {...props} />,
  select: (props) => <SelectControl {...props} />,
  toggle: (props) => <ToggleControl {...props} />,
  spacing: (props) => <SpacingControl {...props} />,
  radius: (props) => <RadiusControl {...props} />,
  shadow: (props) => <ShadowControl {...props} />,
  border: (props) => <BorderControl {...props} />,
  number: (props) => <NumberControl {...props} />,
  text: (props) => <TextControl {...props} />,
};

export function PropertyControlRenderer(props: PropertyControlRendererProps) {
  const Renderer = renderers[props.control.kind] ?? renderers.text;
  return Renderer ? <Renderer {...props} /> : null;
}

function TagRefControl({ control, value, updateProp }: PropertyControlRendererProps) {
  const projectData = useEditorStore((state) => state.document.data);
  if (control.kind !== "tag-ref") return null;
  const tags = Object.values(projectData?.tags ?? {}).filter(
    (tag) => isUdtTag(tag) && tag.type.udtId === control.udtId
  );
  const selectedId = isTagRef(value) ? value.tagId : "";

  return (
    <FormField label="tag">
      <Select
        value={selectedId}
        onChange={(event) => {
          const tag = tags.find((candidate) => candidate.id === event.target.value);
          updateProp(tag ? createTagRef(tag) : undefined);
        }}
      >
        <option value="">Unassigned</option>
        {tags.map((tag) => (
          <option key={tag.id} value={tag.id}>
            {tag.name}
          </option>
        ))}
      </Select>
    </FormField>
  );
}

function ChartSeriesControl(props: PropertyControlRendererProps) {
  if (props.control.kind !== "chart-series") return null;
  return (
    <Box className="space-y-2">
      <SectionHeader
        title="Data points"
        description="Add multiple live tag series to the same chart."
      />
      <ChartSeriesInput
        nodeId={props.nodeId}
        value={props.value}
        values={props.values}
        bindings={props.bindings}
        componentInputs={props.componentInputs}
        updateNode={props.updateNode}
      />
    </Box>
  );
}

function TimeRangeControl({ control, value, updateProp }: PropertyControlRendererProps) {
  if (control.kind !== "time-range") return null;
  const durationMs = getChartTimeRangeDurationMs(value);
  return (
    <FormField label="time range">
      <Select
        value={String(durationMs)}
        onChange={(event) =>
          updateProp(createRelativeChartTimeRange(Number(event.target.value)))
        }
      >
        {CHART_TIME_RANGE_PRESETS.map((preset) => (
          <option key={preset.durationMs} value={preset.durationMs}>
            {preset.label}
          </option>
        ))}
      </Select>
    </FormField>
  );
}

function ImageAssetControl({ control, value, updateProp }: PropertyControlRendererProps) {
  if (control.kind !== "image-asset") return null;
  return (
    <FormField label="Source">
      <ImageAssetPicker
        assetId={typeof value === "string" && value ? value : undefined}
        onChange={(assetId) => updateProp(assetId)}
      />
    </FormField>
  );
}


function TypographyControl({
  control,
  nodeId,
  value,
  values,
  updateNode,
  updateProp,
}: PropertyControlRendererProps) {
  const designSystem = useEditorStore((state) => state.document.designSystem);
  if (control.kind !== "typography") return null;

  const tokens = Object.values(designSystem?.typography ?? {}).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const tokenRef = isTypographyTokenRef(value) ? value : undefined;
  const selectedToken = tokenRef ? designSystem?.typography?.[tokenRef.tokenId] : undefined;
  const mode = tokenRef ? "token" : "local";
  const localStyle = getLocalTypographyStyle(value, values, designSystem);

  function replaceTypographyValue(nextValue: unknown) {
    updateNode(nodeId, (currentNode) => {
      const nextProps: Record<string, unknown> = { ...(currentNode.props ?? {}), textStyle: nextValue };
      // New token/local style owns these fields. Legacy documents continue to
      // render unchanged until the user opts into the new typography control.
      delete nextProps.fontFamily;
      delete nextProps.fontSize;
      delete nextProps.fontWeight;
      delete nextProps.lineHeight;
      delete nextProps.letterSpacing;
      return { ...currentNode, props: nextProps };
    });
  }

  function switchMode(nextMode: "local" | "token") {
    if (nextMode === mode) return;
    if (nextMode === "local") {
      replaceTypographyValue(resolveTypographyValue(value, designSystem, localStyle));
      return;
    }
    const firstToken = tokens[0];
    if (firstToken) replaceTypographyValue(createTypographyTokenRef(firstToken.id));
  }

  function updateLocal(patch: Partial<TypographyStyle>) {
    const next = { ...localStyle, ...patch };
    if (isTypographyStyle(value)) updateProp(next);
    else replaceTypographyValue(next);
  }

  return (
    <FormField label="Typography">
      <Box className="space-y-2">
        <SegmentedControl className="w-full">
          <SegmentedControlItem
            active={mode === "local"}
            className="flex-1 text-xs"
            onClick={() => switchMode("local")}
          >
            Local style
          </SegmentedControlItem>
          <SegmentedControlItem
            active={mode === "token"}
            disabled={tokens.length === 0}
            className="flex-1 text-xs"
            onClick={() => switchMode("token")}
          >
            Design System
          </SegmentedControlItem>
        </SegmentedControl>

        {mode === "token" ? (
          <Box className="space-y-2">
            <Select
              aria-label="Design system typography"
              value={tokenRef?.tokenId ?? ""}
              onChange={(event) => updateProp(createTypographyTokenRef(event.target.value))}
            >
              {tokens.map((token) => (
                <option key={token.id} value={token.id}>
                  {token.name} — {token.fontSize}px / {token.lineHeight}
                </option>
              ))}
            </Select>
            {selectedToken ? (
              <Box
                className="rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] px-3 py-2 text-[var(--editor-text)]"
                style={{
                  fontFamily: selectedToken.fontFamily,
                  fontSize: selectedToken.fontSize,
                  fontWeight: typographyWeightToCss(selectedToken.fontWeight),
                  lineHeight: selectedToken.lineHeight,
                  letterSpacing: selectedToken.letterSpacing,
                }}
              >
                The quick brown fox
              </Box>
            ) : (
              <Box className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] text-amber-700">
                Missing typography token. Choose another style or switch to Local.
              </Box>
            )}
          </Box>
        ) : (
          <Box className="grid grid-cols-2 gap-2">
            <Box className="col-span-2">
              <TextInput
                aria-label="Font family"
                value={localStyle.fontFamily}
                onChange={(event) => updateLocal({ fontFamily: event.target.value })}
                placeholder="Inter, sans-serif"
              />
            </Box>
            <TextInput
              aria-label="Font size"
              type="number"
              min={1}
              value={localStyle.fontSize}
              onChange={(event) => updateLocal({ fontSize: Number(event.target.value) })}
            />
            <Select
              aria-label="Font weight"
              value={localStyle.fontWeight}
              onChange={(event) => updateLocal({ fontWeight: event.target.value as TypographyWeight })}
            >
              <option value="normal">Regular</option>
              <option value="medium">Medium</option>
              <option value="semibold">Semibold</option>
              <option value="bold">Bold</option>
            </Select>
            <TextInput
              aria-label="Line height"
              value={localStyle.lineHeight}
              onChange={(event) => updateLocal({ lineHeight: event.target.value })}
              placeholder="20px"
            />
            <TextInput
              aria-label="Letter spacing"
              type="number"
              step={0.1}
              value={localStyle.letterSpacing}
              onChange={(event) => updateLocal({ letterSpacing: Number(event.target.value) })}
            />
          </Box>
        )}

        {tokens.length === 0 ? (
          <Box className="px-1 text-[10px] leading-4 text-[var(--editor-text-soft)]">
            Add text styles in Design System → Typography to enable references.
          </Box>
        ) : null}
      </Box>
    </FormField>
  );
}

function getLocalTypographyStyle(
  value: unknown,
  values: Record<string, unknown>,
  designSystem: ReturnType<typeof useEditorStore.getState>["document"]["designSystem"]
): TypographyStyle {
  if (isTypographyStyle(value)) return value;
  if (isTypographyTokenRef(value)) return resolveTypographyValue(value, designSystem);
  return {
    fontFamily: typeof values.fontFamily === "string" ? values.fontFamily : DEFAULT_TYPOGRAPHY_STYLE.fontFamily,
    fontSize: typeof values.fontSize === "number" ? values.fontSize : DEFAULT_TYPOGRAPHY_STYLE.fontSize,
    fontWeight: isTypographyWeightValue(values.fontWeight) ? values.fontWeight : DEFAULT_TYPOGRAPHY_STYLE.fontWeight,
    lineHeight: typeof values.lineHeight === "string" ? values.lineHeight : DEFAULT_TYPOGRAPHY_STYLE.lineHeight,
    letterSpacing: typeof values.letterSpacing === "number" ? values.letterSpacing : DEFAULT_TYPOGRAPHY_STYLE.letterSpacing,
  };
}

function isTypographyWeightValue(value: unknown): value is TypographyWeight {
  return value === "normal" || value === "medium" || value === "semibold" || value === "bold";
}

function typographyWeightToCss(weight: TypographyWeight) {
  return weight === "bold" ? 700 : weight === "semibold" ? 600 : weight === "medium" ? 500 : 400;
}

function TextFormatControl({ control, nodeId, values, updateNode }: PropertyControlRendererProps) {
  const designSystem = useEditorStore((state) => state.document.designSystem);
  if (control.kind !== "text-format") return null;
  const typographyValue = values.textStyle;
  const hasTypographyStyle = isTypographyStyle(typographyValue) || isTypographyTokenRef(typographyValue);
  const resolvedTypography = hasTypographyStyle
    ? resolveTypographyValue(typographyValue, designSystem)
    : undefined;
  const bold = resolvedTypography ? resolvedTypography.fontWeight === "bold" : values.fontWeight === "bold";
  const italic = Boolean(values.italic);
  const underline = Boolean(values.underline);

  function toggleTextStyle(
    property: "fontWeight" | "italic" | "underline",
    enabled: boolean
  ) {
    updateNode(nodeId, (currentNode) => {
      const nextProps: Record<string, unknown> = { ...(currentNode.props ?? {}) };
      if (property === "fontWeight" && resolvedTypography) {
        nextProps.textStyle = {
          ...resolvedTypography,
          fontWeight: enabled ? "bold" : "normal",
        } satisfies TypographyStyle;
        delete nextProps.fontWeight;
      } else if (enabled) {
        nextProps[property] = property === "fontWeight" ? "bold" : true;
      } else {
        delete nextProps[property];
      }
      return { ...currentNode, props: nextProps };
    });
  }

  return (
    <FormField label="format">
      <SegmentedControl>
        <SegmentedControlItem
          aria-label="Bold"
          title="Bold"
          active={bold}
          className="font-bold"
          onClick={() => toggleTextStyle("fontWeight", !bold)}
        >
          B
        </SegmentedControlItem>
        <SegmentedControlItem
          aria-label="Italic"
          title="Italic"
          active={italic}
          className="italic"
          onClick={() => toggleTextStyle("italic", !italic)}
        >
          I
        </SegmentedControlItem>
        <SegmentedControlItem
          aria-label="Underline"
          title="Underline"
          active={underline}
          className="underline"
          onClick={() => toggleTextStyle("underline", !underline)}
        >
          U
        </SegmentedControlItem>
      </SegmentedControl>
    </FormField>
  );
}

function TextAlignControl({ control, value, updateProp }: PropertyControlRendererProps) {
  if (control.kind !== "text-align") return null;
  const alignment = value === "center" || value === "right" ? value : "left";
  return (
    <FormField label="alignment">
      <SegmentedControl>
        {(["left", "center", "right"] as const).map((nextAlignment) => (
          <SegmentedControlItem
            key={nextAlignment}
            active={alignment === nextAlignment}
            aria-label={`Align ${nextAlignment}`}
            title={`Align ${nextAlignment}`}
            onClick={() => updateProp(nextAlignment)}
          >
            <TextAlignIcon alignment={nextAlignment} />
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
    </FormField>
  );
}

function BorderSizeControl({ control, value, updateProp }: PropertyControlRendererProps) {
  if (control.kind !== "border-size") return null;
  const borderSize = typeof value === "number" ? value : Number(value ?? control.min ?? 0);
  return (
    <FormField label="border">
      <Box
        data-editor-ignore
        className="flex h-9 w-full items-center overflow-hidden rounded-[12px] border border-[var(--editor-border)] bg-[var(--editor-surface)] transition focus-within:border-[var(--editor-accent-border)] focus-within:ring-2 focus-within:ring-[var(--editor-accent-soft)]"
      >
        <span
          title="Border size · all sides"
          className="flex h-full w-10 shrink-0 items-center justify-center border-r border-[var(--editor-border)] text-[var(--editor-text-muted)]"
        >
          <BorderAllIcon />
        </span>
        <input
          type="number"
          aria-label="Border size"
          value={Number.isFinite(borderSize) ? borderSize : 0}
          min={control.min}
          max={control.max}
          step={control.step}
          onChange={(event) => updateProp(Number(event.target.value))}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-[var(--editor-text)] outline-none"
        />
        <span className="pr-3 text-xs text-[var(--editor-text-muted)] opacity-70">px</span>
      </Box>
    </FormField>
  );
}

function ColorControl({ control, propName, value, updateProp }: PropertyControlRendererProps) {
  const designSystem = useEditorStore((state) => state.document.designSystem);
  const previewThemeId = useEditorStore((state) => state.previewThemeId ?? undefined);
  if (control.kind !== "color") return null;

  const semanticColors = Object.values(designSystem?.semanticColors ?? {}).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const colors = Object.values(designSystem?.colors ?? {}).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const primitiveRef = isColorTokenRef(value) ? value : undefined;
  const semanticRef = isSemanticColorTokenRef(value) ? value : undefined;
  const tokenRef = primitiveRef ?? semanticRef;
  const resolved = resolveColorValue(value, designSystem, undefined, previewThemeId);
  const literalValue = typeof value === "string" && value ? value : resolved;
  const mode = tokenRef ? "token" : "local";
  const selectedValue = semanticRef
    ? `semantic:${semanticRef.tokenId}`
    : primitiveRef
      ? `foundation:${primitiveRef.tokenId}`
      : "";

  function switchMode(nextMode: "local" | "token") {
    if (nextMode === mode) return;
    if (nextMode === "local") {
      updateProp(resolved);
      return;
    }
    const firstSemantic = semanticColors[0];
    if (firstSemantic) {
      updateProp(createSemanticColorTokenRef(firstSemantic.id));
      return;
    }
    const firstFoundation = colors[0];
    if (firstFoundation) updateProp(createColorTokenRef(firstFoundation.id));
  }

  function selectToken(nextValue: string) {
    if (nextValue.startsWith("semantic:")) {
      updateProp(createSemanticColorTokenRef(nextValue.slice("semantic:".length)));
      return;
    }
    if (nextValue.startsWith("foundation:")) {
      updateProp(createColorTokenRef(nextValue.slice("foundation:".length)));
    }
  }

  const selectedName = semanticRef
    ? designSystem?.semanticColors?.[semanticRef.tokenId]?.name
    : primitiveRef
      ? designSystem?.colors?.[primitiveRef.tokenId]?.name
      : undefined;

  return (
    <FormField label={propName}>
      <Box className="space-y-2">
        <SegmentedControl className="w-full">
          <SegmentedControlItem
            active={mode === "local"}
            className="flex-1 text-xs"
            onClick={() => switchMode("local")}
          >
            Local color
          </SegmentedControlItem>
          <SegmentedControlItem
            active={mode === "token"}
            disabled={colors.length === 0 && semanticColors.length === 0}
            className="flex-1 text-xs"
            onClick={() => switchMode("token")}
          >
            Design System
          </SegmentedControlItem>
        </SegmentedControl>

        {mode === "token" ? (
          <Box className="space-y-2">
            <Box className="flex items-center gap-2">
              <span
                className="h-9 w-9 shrink-0 rounded-[12px] border border-[var(--editor-border)] shadow-sm"
                style={{ background: resolved }}
              />
              <Select
                aria-label={`${propName} design system color`}
                value={selectedValue}
                onChange={(event) => selectToken(event.target.value)}
                className="min-w-0 flex-1"
              >
                {semanticColors.length > 0 ? (
                  <optgroup label="Semantic">
                    {semanticColors.map((token) => (
                      <option key={token.id} value={`semantic:${token.id}`}>
                        {token.name} — {resolveColorValue(createSemanticColorTokenRef(token.id), designSystem, undefined, previewThemeId)}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
                {colors.length > 0 ? (
                  <optgroup label="Foundation">
                    {colors.map((token) => (
                      <option key={token.id} value={`foundation:${token.id}`}>
                        {token.name} — {token.value}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
              </Select>
            </Box>
            {selectedName ? (
              <Box className="flex items-center justify-between gap-2 px-1 text-[10px] text-[var(--editor-text-soft)]">
                <span className="truncate">{selectedName}</span>
                <span className="font-mono">{resolved}</span>
              </Box>
            ) : (
              <Box className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] text-amber-700">
                Missing color token. Choose another token or switch to Local.
              </Box>
            )}
          </Box>
        ) : (
          <ColorPickerInput
            ariaLabel={`${propName} color`}
            value={literalValue}
            onChange={updateProp}
          />
        )}

        {colors.length === 0 && semanticColors.length === 0 ? (
          <Box className="px-1 text-[10px] leading-4 text-[var(--editor-text-soft)]">
            Add project colors in Design System → Colors to enable token references.
          </Box>
        ) : null}
      </Box>
    </FormField>
  );
}

function SelectControl({ control, propName, value, updateProp }: PropertyControlRendererProps) {
  if (control.kind !== "select") return null;
  return (
    <FormField label={propName}>
      <Select
        value={String(value ?? control.options[0] ?? "")}
        onChange={(event) => updateProp(event.target.value)}
      >
        {control.options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </Select>
    </FormField>
  );
}

function ToggleControl({ control, propName, value, updateProp }: PropertyControlRendererProps) {
  if (control.kind !== "toggle") return null;
  const checked = Boolean(value);
  return (
    <FormField label={propName}>
      <label className="flex items-center gap-3 h-9 px-3 rounded-[12px] border border-[var(--editor-border)] bg-[var(--editor-surface)] cursor-pointer transition hover:bg-[var(--editor-accent-soft)] hover:border-[var(--editor-accent-border)]">
        <Checkbox checked={checked} onChange={(event) => updateProp(event.target.checked)} />
        <span className="text-sm text-[var(--editor-text-muted)]">
          {checked ? "Enabled" : "Disabled"}
        </span>
      </label>
    </FormField>
  );
}

function SpacingControl({ control, propName, value, updateProp }: PropertyControlRendererProps) {
  if (control.kind !== "spacing") return null;
  return (
    <SpacingValueControl
      label={propName}
      value={value}
      min={control.min ?? 0}
      max={control.max}
      step={control.step ?? 1}
      onChange={updateProp}
    />
  );
}

function RadiusControl({ control, propName, value, updateProp }: PropertyControlRendererProps) {
  if (control.kind !== "radius") return null;
  return (
    <RadiusValueControl
      label={propName}
      value={value}
      min={control.min ?? 0}
      max={control.max}
      step={control.step ?? 1}
      onChange={updateProp}
    />
  );
}

function ShadowControl({ control, propName, value, updateProp }: PropertyControlRendererProps) {
  if (control.kind !== "shadow") return null;
  return <ShadowValueControl label={propName} value={value} onChange={updateProp} />;
}

function BorderControl({
  control,
  nodeId,
  propName,
  value,
  values,
  updateNode,
  updateProp,
}: PropertyControlRendererProps) {
  if (control.kind !== "border") return null;

  const legacyWidth = typeof values.borderSize === "number" ? values.borderSize : 0;
  const legacyColor = typeof values.borderColor === "string" && values.borderColor
    ? values.borderColor
    : "#d4d4d8";
  const effectiveValue = value ?? (legacyWidth > 0
    ? { width: legacyWidth, style: "solid" as const, color: legacyColor }
    : undefined);

  function updateBorder(next: unknown) {
    const hasLegacyBorder = "borderSize" in values || "borderColor" in values;
    if (!hasLegacyBorder) {
      updateProp(next);
      return;
    }

    updateNode(nodeId, (currentNode) => {
      const nextProps = { ...(currentNode.props ?? {}) };
      if (next === undefined) delete nextProps[propName];
      else nextProps[propName] = next;
      delete nextProps.borderSize;
      delete nextProps.borderColor;
      return { ...currentNode, props: nextProps };
    });
  }

  return (
    <BorderValueControl
      label={propName}
      value={effectiveValue}
      fallback={{ width: Math.max(1, legacyWidth || 1), style: "solid", color: legacyColor }}
      onChange={updateBorder}
    />
  );
}

function NumberControl({ control, propName, value, updateProp }: PropertyControlRendererProps) {
  if (control.kind !== "number") return null;
  return (
    <FormField label={propName}>
      <TextInput
        type="number"
        value={typeof value === "number" ? value : Number(value ?? 0)}
        min={control.min}
        max={control.max}
        step={control.step}
        onChange={(event) => updateProp(Number(event.target.value))}
      />
    </FormField>
  );
}

function TextControl({ propName, value, updateProp }: PropertyControlRendererProps) {
  return (
    <FormField label={propName}>
      <TextInput value={String(value ?? "")} onChange={(event) => updateProp(event.target.value)} />
    </FormField>
  );
}

function TextAlignIcon({ alignment }: { alignment: "left" | "center" | "right" }) {
  const lines = [14, 10, 14, 8];
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      {lines.map((width, index) => {
        const x = alignment === "left" ? 1 : alignment === "center" ? (16 - width) / 2 : 15 - width;
        const y = 2 + index * 4;
        return (
          <path
            key={`${width}-${index}`}
            d={`M${x} ${y}H${x + width}`}
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

function BorderAllIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.25" y="2.25" width="11.5" height="11.5" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
      <rect x="5" y="5" width="6" height="6" rx="0.75" stroke="currentColor" strokeWidth="1" opacity="0.55" />
    </svg>
  );
}
