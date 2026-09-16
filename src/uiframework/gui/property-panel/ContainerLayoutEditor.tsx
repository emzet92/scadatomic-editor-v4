import { LayoutGrid, Radius, Rows3 } from "lucide-react";
import {
  defaultContainerProps,
  type ContainerGridItemAlignment,
  type ContainerGridMode,
  type ContainerGridRowMode,
} from "../../component-props";
import type { UiNode } from "../../core/document";
import { resolveSpacingValue } from "../../design-system/spacing";
import { useEditorStore } from "../../editor-store";
import type { UpdateNode } from "./property-panel-types";
import { SpacingValueControl } from "./SpacingValueControl";
import { RadiusValueControl } from "./RadiusValueControl";
import { ShadowValueControl } from "./ShadowValueControl";
import { BorderValueControl } from "./BorderValueControl";
import {
  Badge,
  ChoiceCard,
  SegmentedControl,
  SegmentedControlItem,
  Stepper,
} from "../ui";

type GridPreset = {
  id: string;
  label: string;
  description: string;
  columns: number;
  mode: ContainerGridMode;
  minColumnWidth?: number;
  gap: number;
  padding: number;
};

const GRID_PRESETS: readonly GridPreset[] = [
  {
    id: "stack",
    label: "Stack",
    description: "Single column",
    columns: 1,
    mode: "fixed",
    gap: 12,
    padding: 12,
  },
  {
    id: "split",
    label: "Split",
    description: "Two equal columns",
    columns: 2,
    mode: "fixed",
    gap: 12,
    padding: 12,
  },
  {
    id: "cards",
    label: "Cards",
    description: "Three columns",
    columns: 3,
    mode: "fixed",
    gap: 12,
    padding: 12,
  },
  {
    id: "dense",
    label: "Dense",
    description: "Four compact columns",
    columns: 4,
    mode: "fixed",
    gap: 8,
    padding: 8,
  },
  {
    id: "adaptive",
    label: "Adaptive",
    description: "Reflows automatically",
    columns: 1,
    mode: "adaptive",
    minColumnWidth: 220,
    gap: 12,
    padding: 12,
  },
];

const SPACING_PRESETS = [
  { label: "Tight", value: 4 },
  { label: "Comfort", value: 12 },
  { label: "Relaxed", value: 20 },
] as const;

export function ContainerLayoutEditor({
  node,
  updateNode,
}: {
  node: UiNode;
  updateNode: UpdateNode;
}) {
  const rawProps = node.props ?? {};
  const designSystem = useEditorStore((state) => state.document.designSystem);
  const display = rawProps.display === "flex" ? "flex" : "grid";
  const gridMode: ContainerGridMode =
    rawProps.gridMode === "adaptive" ? "adaptive" : "fixed";
  const columns = clampInt(rawProps.columns, 1, 12, defaultContainerProps.columns);
  const gapValue = rawProps.gap ?? defaultContainerProps.gap;
  const paddingValue = rawProps.padding ?? defaultContainerProps.padding;
  const borderValue = rawProps.border ?? {
    width: typeof rawProps.borderSize === "number" ? rawProps.borderSize : defaultContainerProps.borderSize ?? 1,
    style: "solid" as const,
    color: typeof rawProps.borderColor === "string" ? rawProps.borderColor : "#d4d4d8",
  };
  const borderRadiusValue = rawProps.borderRadius ?? defaultContainerProps.borderRadius;
  const shadowValue = rawProps.shadow;
  const gap = clampInt(
    resolveSpacingValue(gapValue, designSystem, defaultContainerProps.gap),
    0,
    64,
    defaultContainerProps.gap
  );
  const padding = clampInt(
    resolveSpacingValue(paddingValue, designSystem, defaultContainerProps.padding),
    0,
    64,
    defaultContainerProps.padding
  );
  const minColumnWidth = clampInt(
    rawProps.minColumnWidth,
    96,
    640,
    defaultContainerProps.minColumnWidth
  );
  const minRowHeight = clampInt(
    rawProps.minRowHeight,
    24,
    480,
    defaultContainerProps.minRowHeight
  );
  const gridRowMode: ContainerGridRowMode =
    rawProps.gridRowMode === "minimum" ? "minimum" : "content";
  const gridItemAlignment: ContainerGridItemAlignment =
    rawProps.gridItemAlignment === "center" ||
    rawProps.gridItemAlignment === "end" ||
    rawProps.gridItemAlignment === "stretch"
      ? rawProps.gridItemAlignment
      : "start";

  function patch(nextProps: Record<string, unknown>) {
    updateNode(node.id, (current) => ({
      ...current,
      props: {
        ...(current.props ?? {}),
        ...nextProps,
      },
    }));
  }

  return (
    <section className="overflow-hidden rounded-[20px] border border-[var(--editor-border)] bg-[var(--editor-surface)] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-3 px-4 pb-3 pt-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-[14px] bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]">
          <LayoutGrid size={17} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[var(--editor-text)]">Layout</div>
          <div className="mt-0.5 text-[11px] leading-4 text-[var(--editor-text-muted)]">
            Stable grid presets with predictable spacing and adaptive reflow.
          </div>
        </div>
      </div>

      <div className="px-3 pb-3">
        <SegmentedControl variant="soft" fullWidth>
          <SegmentedControlItem
            variant="soft"
            grow
            active={display === "grid"}
            onClick={() => patch({ display: "grid" })}
          >
            Grid
          </SegmentedControlItem>
          <SegmentedControlItem
            variant="soft"
            grow
            active={display === "flex"}
            onClick={() => patch({ display: "flex" })}
          >
            Flow
          </SegmentedControlItem>
        </SegmentedControl>
      </div>

      {display === "grid" ? (
        <>
          <div className="border-t border-[var(--editor-border)] px-4 py-4">
            <div className="mb-2.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--editor-text-muted)]">
                  Grid preset
                </div>
                <div className="mt-0.5 text-[10px] text-[var(--editor-text-soft)]">
                  Pick a safe starting structure.
                </div>
              </div>
              <Badge variant="accent" size="sm">
                {gridMode === "adaptive" ? "Adaptive" : `${columns} col`}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {GRID_PRESETS.map((preset) => {
                const active =
                  preset.mode === gridMode &&
                  (preset.mode === "adaptive" || preset.columns === columns);
                return (
                  <ChoiceCard
                    key={preset.id}
                    selected={active}
                    title={preset.label}
                    description={preset.description}
                    preview={
                      <MiniGrid
                        columns={preset.mode === "adaptive" ? 3 : preset.columns}
                        adaptive={preset.mode === "adaptive"}
                        active={active}
                      />
                    }
                    onClick={() =>
                      patch({
                        gridMode: preset.mode,
                        columns: preset.columns,
                        gap: preset.gap,
                        padding: preset.padding,
                        ...(preset.minColumnWidth
                          ? { minColumnWidth: preset.minColumnWidth }
                          : {}),
                      })
                    }
                  />
                );
              })}
            </div>
          </div>

          <div className="border-t border-[var(--editor-border)] px-4 py-4">
            <ControlRow
              label={gridMode === "adaptive" ? "Min column" : "Columns"}
              description={
                gridMode === "adaptive"
                  ? "Columns collapse before they overflow."
                  : "Equal tracks; content is clamped to each track."
              }
            >
              {gridMode === "adaptive" ? (
                <Stepper
                  value={minColumnWidth}
                  suffix="px"
                  onDecrease={() =>
                    patch({ minColumnWidth: Math.max(96, minColumnWidth - 20) })
                  }
                  onIncrease={() =>
                    patch({ minColumnWidth: Math.min(640, minColumnWidth + 20) })
                  }
                />
              ) : (
                <Stepper
                  value={columns}
                  onDecrease={() => patch({ columns: Math.max(1, columns - 1) })}
                  onIncrease={() => patch({ columns: Math.min(12, columns + 1) })}
                />
              )}
            </ControlRow>

            <div className="mt-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--editor-text-muted)]">
                Vertical sizing
              </div>
              <SegmentedControl variant="soft" fullWidth className="mt-2">
                <SegmentedControlItem
                  variant="soft"
                  grow
                  active={gridRowMode === "content"}
                  onClick={() => patch({ gridRowMode: "content" })}
                >
                  Hug content
                </SegmentedControlItem>
                <SegmentedControlItem
                  variant="soft"
                  grow
                  active={gridRowMode === "minimum"}
                  onClick={() => patch({ gridRowMode: "minimum" })}
                >
                  Minimum row
                </SegmentedControlItem>
              </SegmentedControl>
              <div className="mt-1.5 text-[10px] leading-4 text-[var(--editor-text-muted)]">
                Hug keeps rows as short as their content. Minimum reserves a predictable target height.
              </div>
            </div>

            {gridRowMode === "minimum" ? (
              <div className="mt-4">
                <ControlRow
                  label="Minimum row"
                  description="Only used while Minimum row sizing is enabled."
                >
                  <Stepper
                    value={minRowHeight}
                    suffix="px"
                    onDecrease={() =>
                      patch({ minRowHeight: Math.max(24, minRowHeight - 8) })
                    }
                    onIncrease={() =>
                      patch({ minRowHeight: Math.min(480, minRowHeight + 8) })
                    }
                  />
                </ControlRow>
              </div>
            ) : null}

            <div className="mt-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--editor-text-muted)]">
                Items in row
              </div>
              <SegmentedControl variant="soft" fullWidth className="mt-2">
                {([
                  ["start", "Top"],
                  ["center", "Center"],
                  ["end", "Bottom"],
                  ["stretch", "Fill"],
                ] as const).map(([value, label]) => (
                  <SegmentedControlItem
                    key={value}
                    variant="soft"
                    grow
                    active={gridItemAlignment === value}
                    onClick={() => patch({ gridItemAlignment: value })}
                  >
                    {label}
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
              <div className="mt-1.5 text-[10px] leading-4 text-[var(--editor-text-muted)]">
                Top is the default: components keep their own height instead of filling downward.
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="border-t border-[var(--editor-border)] px-4 py-4">
          <div className="flex items-center gap-3 rounded-[16px] bg-[var(--editor-surface-muted)] p-3">
            <Rows3 size={18} className="text-[var(--editor-accent)]" />
            <div>
              <div className="text-xs font-semibold text-[var(--editor-text)]">Flow layout</div>
              <div className="mt-0.5 text-[10px] leading-4 text-[var(--editor-text-muted)]">
                Children wrap naturally. Use Grid when alignment must stay locked.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-[var(--editor-border)] px-4 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--editor-text-muted)]">
          Spacing
        </div>
        <SegmentedControl variant="soft" fullWidth className="mt-2">
          {SPACING_PRESETS.map((preset) => (
            <SegmentedControlItem
              key={preset.value}
              variant="soft"
              grow
              active={gap === preset.value && padding === preset.value}
              onClick={() => patch({ gap: preset.value, padding: preset.value })}
            >
              {preset.label}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <SpacingValueControl
            compact
            label="Gap"
            value={gapValue}
            fallback={defaultContainerProps.gap}
            min={0}
            max={64}
            onChange={(value) => patch({ gap: value })}
          />
          <SpacingValueControl
            compact
            label="Padding"
            value={paddingValue}
            fallback={defaultContainerProps.padding}
            min={0}
            max={64}
            onChange={(value) => patch({ padding: value })}
          />
        </div>
        <div className="mt-2 space-y-2">
          <BorderValueControl
            label="Border / stroke"
            value={borderValue}
            fallback={{ width: defaultContainerProps.borderSize ?? 1, style: "solid", color: "#d4d4d8" }}
            onChange={(value) => patch({ border: value })}
          />
          <RadiusValueControl
            compact
            icon={<Radius size={12} />}
            label="Corner radius"
            value={borderRadiusValue}
            fallback={defaultContainerProps.borderRadius}
            min={0}
            max={999}
            onChange={(value) => patch({ borderRadius: value })}
          />
          <ShadowValueControl
            label="Shadow / elevation"
            value={shadowValue}
            onChange={(value) => patch({ shadow: value })}
          />
        </div>
      </div>
    </section>
  );
}

function MiniGrid({
  columns,
  adaptive,
  active,
}: {
  columns: number;
  adaptive: boolean;
  active: boolean;
}) {
  return (
    <div
      className="grid h-8 gap-1 rounded-[10px] p-1.5"
      style={{
        gridTemplateColumns: `repeat(${Math.max(1, Math.min(columns, 4))}, minmax(0, 1fr))`,
        background: active ? "rgba(79,70,229,.10)" : "var(--editor-surface-muted)",
      }}
    >
      {Array.from({ length: adaptive ? 5 : Math.min(columns * 2, 8) }).map((_, index) => (
        <span
          key={index}
          className="rounded-[3px]"
          style={{
            background: active
              ? "var(--editor-accent)"
              : "var(--editor-border-strong)",
            opacity: adaptive && index === 4 ? 0.45 : 0.9,
          }}
        />
      ))}
    </div>
  );
}

function ControlRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-xs font-medium text-[var(--editor-text)]">{label}</div>
        <div className="mt-0.5 text-[10px] leading-4 text-[var(--editor-text-muted)]">
          {description}
        </div>
      </div>
      {children}
    </div>
  );
}

function clampInt(
  value: unknown,
  min: number,
  max: number,
  fallback: number
) {
  const number = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}
