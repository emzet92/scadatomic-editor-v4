import { Plus, Trash2 } from "lucide-react";
import type { Binding, ComponentInputDefinition, UiNode } from "../../core/document";
import {
  CHART_SERIES_COLORS,
  chartSeriesBindingKey,
  createChartSeriesDefinition,
  readChartSeries,
  type ChartSeriesDefinition,
} from "../../chart-series";
import { useEditorStore } from "../../editor-store";
import { Button, FormField, IconButton, TextInput } from "../ui";
import type { UpdateNode } from "./property-panel-types";
import {
  formatBindingPath,
  getKnownBindingPaths,
  parseBindingPath,
} from "./binding-paths";

export function ChartSeriesInput({
  nodeId,
  value,
  values,
  bindings,
  componentInputs,
  updateNode,
}: {
  nodeId: string;
  value: unknown;
  values: Record<string, unknown>;
  bindings: Record<string, Binding> | undefined;
  componentInputs: Record<string, ComponentInputDefinition> | undefined;
  updateNode: UpdateNode;
}) {
  const projectData = useEditorStore((state) => state.document.data);
  const paths = getKnownBindingPaths(projectData, componentInputs);
  const dataListId = `chart-series-paths-${nodeId}`;
  const persistedSeries = readChartSeries(value);
  const legacyBinding = bindings?.value;
  const legacySeries = persistedSeries.length === 0 && legacyBinding
    ? createLegacySeries(values)
    : null;
  const visibleSeries = legacySeries ? [legacySeries] : persistedSeries;

  function mutate(
    mutation: (
      series: ChartSeriesDefinition[],
      nextBindings: Record<string, Binding>,
    ) => void,
  ) {
    updateNode(nodeId, (currentNode) => {
      const normalized = normalizeForEdit(currentNode, values);
      const nextSeries = [...normalized.series];
      const nextBindings = { ...normalized.bindings };
      mutation(nextSeries, nextBindings);

      const nextProps = {
        ...(currentNode.props ?? {}),
        series: nextSeries,
      };

      return {
        ...currentNode,
        props: nextProps,
        bindings: Object.keys(nextBindings).length > 0 ? nextBindings : undefined,
      };
    });
  }

  function addSeries() {
    mutate((series) => {
      series.push(createChartSeriesDefinition(series.length));
    });
  }

  function updateSeries(seriesId: string, patch: Partial<ChartSeriesDefinition>) {
    mutate((series) => {
      const index = series.findIndex((item) => item.id === seriesId);
      const current = series[index];
      if (index < 0 || !current) return;
      series[index] = { ...current, ...patch };
    });
  }

  function updateBinding(seriesId: string, path: string) {
    mutate((_series, nextBindings) => {
      const key = chartSeriesBindingKey(seriesId);
      const binding = parseBindingPath(path.trim(), componentInputs);
      if (binding) nextBindings[key] = binding;
      else delete nextBindings[key];
    });
  }

  function removeSeries(seriesId: string) {
    mutate((series, nextBindings) => {
      const index = series.findIndex((item) => item.id === seriesId);
      if (index >= 0) series.splice(index, 1);
      delete nextBindings[chartSeriesBindingKey(seriesId)];
    });
  }

  return (
    <div className="space-y-3">
      <datalist id={dataListId}>
        {paths.all.map((path) => <option key={path} value={path} />)}
      </datalist>

      {visibleSeries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--editor-border)] p-3 text-xs text-[var(--editor-text-muted)]">
          Add a data point and bind it to a numeric tag.
        </div>
      ) : null}

      {visibleSeries.map((series, index) => {
        const binding = legacySeries && series.id === legacySeries.id
          ? legacyBinding
          : bindings?.[chartSeriesBindingKey(series.id)];
        const source = formatBindingPath(binding);

        return (
          <div
            key={series.id}
            className="space-y-2 rounded-lg border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] p-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">
                Data point {index + 1}
              </div>
              <IconButton
                aria-label={`Remove ${series.label}`}
                title="Remove data point"
                variant="danger"
                size="icon-xs"
                onClick={() => removeSeries(series.id)}
              >
                <Trash2 size={12} />
              </IconButton>
            </div>

            <div className="grid grid-cols-[1fr_42px] gap-2">
              <FormField label="Label" compact>
                <TextInput
                  controlSize="sm"
                  value={series.label}
                  onChange={(event) => updateSeries(series.id, { label: event.target.value })}
                />
              </FormField>
              <FormField label="Color" compact>
                <input
                  data-editor-ignore
                  type="color"
                  aria-label={`${series.label} color`}
                  className="h-8 w-full cursor-pointer rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface)] p-1"
                  value={normalizeColor(series.color, index)}
                  onChange={(event) => updateSeries(series.id, { color: event.target.value })}
                />
              </FormField>
            </div>

            <FormField
              label="Source"
              compact
              description={paths.relativePaths.length > 0
                ? `Project tag or component input, e.g. ${paths.relativePaths[0]}`
                : "Project tag or UDT field, e.g. Pump1.rpm"}
            >
              <TextInput
                controlSize="sm"
                mono
                list={dataListId}
                value={source}
                placeholder={paths.relativePaths[0] ?? paths.absolutePaths[0] ?? "Pump1.rpm"}
                onChange={(event) => updateBinding(series.id, event.target.value)}
              />
            </FormField>
          </div>
        );
      })}

      <Button size="xs" onClick={addSeries}>
        <Plus size={12} /> Add data point
      </Button>
    </div>
  );
}

function normalizeForEdit(
  node: UiNode,
  fallbackValues: Record<string, unknown>,
): {
  series: ChartSeriesDefinition[];
  bindings: Record<string, Binding>;
} {
  const props = {
    ...fallbackValues,
    ...(node.props ?? {}),
  };
  const persisted = readChartSeries(props.series);
  const nextBindings = { ...(node.bindings ?? {}) };

  if (persisted.length > 0) {
    return { series: persisted, bindings: nextBindings };
  }

  const legacyBinding = nextBindings.value;
  if (!legacyBinding) {
    return { series: persisted, bindings: nextBindings };
  }

  const migrated = createLegacySeries(props);
  nextBindings[chartSeriesBindingKey(migrated.id)] = legacyBinding;
  delete nextBindings.value;
  return { series: [migrated], bindings: nextBindings };
}

function createLegacySeries(values: Record<string, unknown>): ChartSeriesDefinition {
  const series = createChartSeriesDefinition(0, {
    label: typeof values.title === "string" && values.title.trim()
      ? values.title
      : "Value",
    color: typeof values.color === "string" && values.color.trim()
      ? values.color
      : CHART_SERIES_COLORS[0],
  });

  return {
    ...series,
    // Stable within the current render so the virtual legacy row can be edited.
    id: "__legacy_chart_value__",
  };
}

function normalizeColor(color: string, index: number) {
  return /^#[0-9a-fA-F]{6}$/.test(color)
    ? color
    : CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length]!;
}
