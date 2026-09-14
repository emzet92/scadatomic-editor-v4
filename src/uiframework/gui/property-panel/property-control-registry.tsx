import type { ReactNode } from "react";
import type { Binding, ComponentInputDefinition } from "../../core/document";
import type { InspectorControl } from "../../registry/component-definitions";
import { useEditorStore } from "../../editor-store";
import {
  createColorTokenRef,
  isColorTokenRef,
  normalizeColorForNativeInput,
  resolveColorValue,
} from "../../design-system/colors";
import { createTagRef, isTagRef } from "../../data/collections/TagRef";
import { isUdtTag } from "../../data/tags/TagDefinition";
import {
  CHART_TIME_RANGE_PRESETS,
  createRelativeChartTimeRange,
  getChartTimeRangeDurationMs,
} from "../../chart-time-range";
import type { UpdateNode } from "./property-panel-types";
import { ChartSeriesInput } from "./ChartSeriesInput";
import { ImageAssetPicker } from "../assets/ImageAssetPicker";
import {
  Checkbox,
  FormField,
  SectionHeader,
  SegmentedControl,
  SegmentedControlItem,
  Select,
  TextInput,
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

const renderers: Partial<Record<InspectorControl["kind"], PropertyControlRenderer>> = {
  "tag-ref": (props) => <TagRefControl {...props} />,
  "chart-series": (props) => <ChartSeriesControl {...props} />,
  "time-range": (props) => <TimeRangeControl {...props} />,
  "image-asset": (props) => <ImageAssetControl {...props} />,
  "text-format": (props) => <TextFormatControl {...props} />,
  "text-align": (props) => <TextAlignControl {...props} />,
  "border-size": (props) => <BorderSizeControl {...props} />,
  color: (props) => <ColorControl {...props} />,
  select: (props) => <SelectControl {...props} />,
  toggle: (props) => <ToggleControl {...props} />,
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
    <div className="space-y-2">
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
    </div>
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

function TextFormatControl({ control, nodeId, values, updateNode }: PropertyControlRendererProps) {
  if (control.kind !== "text-format") return null;
  const bold = values.fontWeight === "bold";
  const italic = Boolean(values.italic);
  const underline = Boolean(values.underline);

  function toggleTextStyle(
    property: "fontWeight" | "italic" | "underline",
    enabled: boolean
  ) {
    updateNode(nodeId, (currentNode) => {
      const nextProps = { ...(currentNode.props ?? {}) };
      if (enabled) nextProps[property] = property === "fontWeight" ? "bold" : true;
      else delete nextProps[property];
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
      <div
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
      </div>
    </FormField>
  );
}

function ColorControl({ control, propName, value, updateProp }: PropertyControlRendererProps) {
  const designSystem = useEditorStore((state) => state.document.designSystem);
  if (control.kind !== "color") return null;

  const colors = Object.values(designSystem?.colors ?? {}).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const tokenRef = isColorTokenRef(value) ? value : undefined;
  const selectedToken = tokenRef ? designSystem?.colors[tokenRef.tokenId] : undefined;
  const resolved = resolveColorValue(value, designSystem);
  const literalValue = typeof value === "string" && value ? value : resolved;
  const mode = tokenRef ? "token" : "local";

  function switchMode(nextMode: "local" | "token") {
    if (nextMode === mode) return;
    if (nextMode === "local") {
      updateProp(resolved);
      return;
    }
    const firstToken = colors[0];
    if (firstToken) updateProp(createColorTokenRef(firstToken.id));
  }

  return (
    <FormField label={propName}>
      <div className="space-y-2">
        <SegmentedControl className="w-full">
          <SegmentedControlItem
            active={mode === "local"}
            className="flex-1 text-xs"
            onClick={() => switchMode("local")}
          >
            Local
          </SegmentedControlItem>
          <SegmentedControlItem
            active={mode === "token"}
            disabled={colors.length === 0}
            className="flex-1 text-xs"
            onClick={() => switchMode("token")}
          >
            Token
          </SegmentedControlItem>
        </SegmentedControl>

        {mode === "token" ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className="h-9 w-9 shrink-0 rounded-[12px] border border-[var(--editor-border)] shadow-sm"
                style={{ background: selectedToken?.value ?? resolved }}
              />
              <Select
                value={tokenRef?.tokenId ?? ""}
                onChange={(event) => updateProp(createColorTokenRef(event.target.value))}
                className="min-w-0 flex-1"
              >
                {colors.map((token) => (
                  <option key={token.id} value={token.id}>
                    {token.name}
                  </option>
                ))}
              </Select>
            </div>
            {selectedToken ? (
              <div className="flex items-center justify-between gap-2 px-1 text-[10px] text-[var(--editor-text-soft)]">
                <span className="truncate">{selectedToken.name}</span>
                <span className="font-mono">{selectedToken.value}</span>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] text-amber-700">
                Missing color token. Choose another token or switch to Local.
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              data-editor-ignore
              type="color"
              value={normalizeColorForNativeInput(namedColors[literalValue.toLowerCase()] ?? literalValue)}
              onChange={(event) => updateProp(event.target.value)}
              className="h-9 w-12 rounded-[12px] border border-[var(--editor-border)] bg-[var(--editor-surface)] p-1 cursor-pointer transition hover:border-[var(--editor-accent-border)]"
            />
            <TextInput value={literalValue} onChange={(event) => updateProp(event.target.value)} />
          </div>
        )}

        {colors.length === 0 ? (
          <div className="px-1 text-[10px] leading-4 text-[var(--editor-text-soft)]">
            Add project colors in Design System → Colors to enable token references.
          </div>
        ) : null}
      </div>
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
