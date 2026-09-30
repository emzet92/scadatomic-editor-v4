import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { HistorianSampleRepository } from "../application";
import type { HistorianSample, HistorianTagDescriptor } from "../domain";
import { Button, DatabaseIcon, DeleteIcon, FormField, ResetIcon, Select, Surface } from "../../shared/ui";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const RANGE_OPTIONS = [
  { label: "Last 5 minutes", value: 5 * 60_000 },
  { label: "Last 30 minutes", value: 30 * 60_000 },
  { label: "Last hour", value: 60 * 60_000 },
  { label: "Last 6 hours", value: 6 * 60 * 60_000 },
  { label: "Last 24 hours", value: 24 * 60 * 60_000 },
] as const;

export function HistorianExplorerView({
  projectId,
  tags,
  repository,
}: {
  projectId: string;
  tags: HistorianTagDescriptor[];
  repository: HistorianSampleRepository;
}) {
  const [selectedTag, setSelectedTag] = useState(tags[0]?.path ?? "");
  const [rangeMs, setRangeMs] = useState<number>(60 * 60_000);
  const [samples, setSamples] = useState<HistorianSample[]>([]);
  const [loading, setLoading] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const now = Date.now();
      const next = await repository.query({
        projectId,
        tagPaths: selectedTag ? [selectedTag] : undefined,
        from: now - rangeMs,
        to: now,
        order: "asc",
        limit: 20_000,
      });
      setSamples(next);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [projectId, rangeMs, selectedTag]);

  useEffect(() => repository.subscribe(projectId, () => void reload()), [projectId, rangeMs, repository, selectedTag]);

  const numericSamples = useMemo(
    () => samples.filter((sample): sample is HistorianSample & { value: number } => typeof sample.value === "number"),
    [samples],
  );

  const chartData: ChartData<"line", number[], string> = {
    labels: numericSamples.map((sample) => formatTimestamp(sample.timestamp)),
    datasets: [
      {
        label: selectedTag || "Value",
        data: numericSamples.map((sample) => sample.value),
        borderWidth: 2,
        pointRadius: numericSamples.length > 250 ? 0 : 2,
        tension: 0.22,
      },
    ],
  };
  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: { legend: { display: true, position: "top" } },
    scales: { x: { ticks: { maxTicksLimit: 8 } } },
  };

  return (
    <div className="min-h-0 flex-1 overflow-auto bg-[var(--editor-canvas-bg)] p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--editor-text)]">Historian</h2>
            <p className="mt-1 text-sm text-[var(--editor-text-soft)]">Explore persisted tag samples independently from the live runtime signal store.</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <FormField label="Tag" compact className="w-64">
              <Select controlSize="sm" value={selectedTag} onChange={(event) => setSelectedTag(event.target.value)}>
                {tags.map((tag) => <option key={tag.path} value={tag.path}>{tag.path}</option>)}
              </Select>
            </FormField>
            <FormField label="Range" compact className="w-44">
              <Select controlSize="sm" value={String(rangeMs)} onChange={(event) => setRangeMs(Number(event.target.value))}>
                {RANGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
            </FormField>
            <Button size="sm" onClick={() => void reload()} leadingIcon={<ResetIcon size={13} />}>{loading ? "Loading…" : "Refresh"}</Button>
            <Button
              size="sm"
              variant="danger"
              leadingIcon={<DeleteIcon size={13} />}
              disabled={!selectedTag}
              onClick={() => void repository.clear(projectId, selectedTag).then(reload)}
            >
              Clear tag
            </Button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.45fr)]">
          <Surface padding="lg" shadow="sm" className="min-h-[380px]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-[var(--editor-text)]">Trend</div>
                <div className="text-[11px] text-[var(--editor-text-soft)]">{numericSamples.length} numeric samples</div>
              </div>
            </div>
            <div className="h-[320px]">
              {numericSamples.length > 0 ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[var(--editor-text-soft)]">
                  {samples.length > 0 ? "Selected tag is not numeric. Use the table below." : "No samples in this time range."}
                </div>
              )}
            </div>
          </Surface>

          <Surface padding="lg" shadow="sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--editor-text)]"><DatabaseIcon size={15} /> Snapshot</div>
            <dl className="mt-4 space-y-3 text-xs">
              <Metric label="Samples" value={String(samples.length)} />
              <Metric label="First" value={samples[0] ? new Date(samples[0].timestamp).toLocaleString() : "—"} />
              <Metric label="Latest" value={samples.at(-1) ? new Date(samples.at(-1)!.timestamp).toLocaleString() : "—"} />
              <Metric label="Latest value" value={samples.at(-1) ? formatValue(samples.at(-1)!.value) : "—"} mono />
            </dl>
          </Surface>
        </div>

        <Surface padding="none" shadow="sm" className="overflow-hidden">
          <div className="border-b border-[var(--editor-border)] px-4 py-3 text-sm font-semibold text-[var(--editor-text)]">Samples</div>
          <div className="max-h-[460px] overflow-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 bg-[var(--editor-surface-muted)] text-[10px] uppercase tracking-wide text-[var(--editor-text-soft)]">
                <tr>
                  <th className="px-4 py-2 font-semibold">Timestamp</th>
                  <th className="px-4 py-2 font-semibold">Tag</th>
                  <th className="px-4 py-2 font-semibold">Value</th>
                  <th className="px-4 py-2 font-semibold">Quality</th>
                </tr>
              </thead>
              <tbody>
                {[...samples].reverse().map((sample) => (
                  <tr key={sample.id} className="border-t border-[var(--editor-border)] text-[var(--editor-text-muted)]">
                    <td className="whitespace-nowrap px-4 py-2 font-mono text-[11px]">{new Date(sample.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-2 font-mono text-[11px] text-[var(--editor-text)]">{sample.tagPath}</td>
                    <td className="px-4 py-2 font-mono text-[11px]">{formatValue(sample.value)}</td>
                    <td className="px-4 py-2"><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">{sample.quality ?? "good"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      </div>
    </div>
  );
}

function Metric({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--editor-border)] pb-2 last:border-0">
      <dt className="text-[var(--editor-text-soft)]">{label}</dt>
      <dd className={`text-right text-[var(--editor-text)] ${mono ? "font-mono" : "font-medium"}`}>{value}</dd>
    </div>
  );
}

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatValue(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(3);
  return value === null ? "null" : "—";
}
