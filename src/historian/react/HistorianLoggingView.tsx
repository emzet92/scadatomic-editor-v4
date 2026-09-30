import { useEffect, useMemo, useState } from "react";
import type { HistorianConfigRepository } from "../application";
import {
  createDefaultHistorianConfig,
  type HistorianSamplingPolicy,
  type HistorianTagConfig,
  type HistorianTagDescriptor,
} from "../domain";
import {
  ActivityIcon,
  AddIcon,
  Button,
  Checkbox,
  DatabaseIcon,
  DeleteIcon,
  FormField,
  Select,
  Surface,
  TextInput,
} from "../../shared/ui";

export function HistorianLoggingView({
  projectId,
  tags,
  repository,
}: {
  projectId: string;
  tags: HistorianTagDescriptor[];
  repository: HistorianConfigRepository;
}) {
  const [configs, setConfigs] = useState<HistorianTagConfig[]>([]);
  const [selectedPath, setSelectedPath] = useState(tags[0]?.path ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function reload() {
      try {
        const next = await repository.list(projectId);
        if (!cancelled) setConfigs(next);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Failed to load historian config.");
      }
    }
    void reload();
    return () => {
      cancelled = true;
    };
  }, [projectId, repository]);

  useEffect(() => repository.subscribe(projectId, () => {
    void repository.list(projectId).then(setConfigs).catch(() => undefined);
  }), [projectId, repository]);

  const configuredPaths = useMemo(() => new Set(configs.map((config) => config.tagPath)), [configs]);
  const addableTags = tags.filter((tag) => !configuredPaths.has(tag.path));

  async function addTag() {
    const tag = tags.find((candidate) => candidate.path === selectedPath) ?? addableTags[0];
    if (!tag) return;
    await repository.save(createDefaultHistorianConfig(projectId, tag));
    const nextTag = addableTags.find((candidate) => candidate.path !== tag.path);
    setSelectedPath(nextTag?.path ?? "");
  }

  async function updateConfig(config: HistorianTagConfig, patch: Partial<HistorianTagConfig>) {
    await repository.save({ ...config, ...patch, updatedAt: Date.now() });
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[320px_minmax(0,1fr)] overflow-hidden">
      <aside className="border-r border-[var(--editor-border)] bg-[var(--editor-surface)] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--editor-text)]">
          <DatabaseIcon size={16} className="text-[var(--editor-accent)]" /> Logging configuration
        </div>
        <p className="mt-1 text-xs leading-5 text-[var(--editor-text-soft)]">
          Configure which runtime tags are persisted and when a new sample is written.
        </p>

        <div className="mt-5 space-y-2">
          <FormField label="Tag" compact>
            <Select
              controlSize="sm"
              value={selectedPath}
              onChange={(event) => setSelectedPath(event.target.value)}
              disabled={addableTags.length === 0}
            >
              {addableTags.length === 0 ? <option value="">All tags configured</option> : null}
              {addableTags.map((tag) => (
                <option key={tag.path} value={tag.path}>{tag.path}</option>
              ))}
            </Select>
          </FormField>
          <Button
            size="sm"
            variant="primary"
            className="w-full"
            leadingIcon={<AddIcon size={13} />}
            disabled={addableTags.length === 0}
            onClick={() => void addTag()}
          >
            Add tag to historian
          </Button>
        </div>

        <Surface variant="muted" className="mt-5 text-[11px] leading-5 text-[var(--editor-text-soft)]">
          Numeric tags can use percent/absolute deadband. Strings and booleans are normally logged only when the value changes.
        </Surface>
      </aside>

      <main className="min-w-0 overflow-auto bg-[var(--editor-canvas-bg)] p-6">
        <div className="mx-auto max-w-5xl space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--editor-text)]">Tag logging</h2>
            <p className="mt-1 text-sm text-[var(--editor-text-soft)]">
              IndexedDB is only the current repository adapter. Sampling rules depend on historian ports, not browser storage.
            </p>
          </div>

          {error ? <Surface variant="danger">{error}</Surface> : null}

          {configs.length === 0 ? (
            <Surface className="py-12 text-center">
              <ActivityIcon size={28} className="mx-auto text-[var(--editor-text-soft)]" />
              <div className="mt-3 text-sm font-medium text-[var(--editor-text)]">No tags are logged yet</div>
              <div className="mt-1 text-xs text-[var(--editor-text-soft)]">Select a tag on the left to create its first sampling policy.</div>
            </Surface>
          ) : (
            configs.map((config) => {
              const descriptor = tags.find((tag) => tag.path === config.tagPath);
              return (
                <LoggingConfigCard
                  key={config.id}
                  config={config}
                  numeric={descriptor?.valueKind === "number"}
                  onChange={(patch) => void updateConfig(config, patch)}
                  onDelete={() => void repository.remove(config.id)}
                />
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

function LoggingConfigCard({
  config,
  numeric,
  onChange,
  onDelete,
}: {
  config: HistorianTagConfig;
  numeric: boolean;
  onChange: (patch: Partial<HistorianTagConfig>) => void;
  onDelete: () => void;
}) {
  const policy = config.policy;
  const policyKind = policy.kind;
  const threshold = policy.kind === "interval" ? undefined : policy.threshold;
  const intervalMs = policy.kind === "on-change" ? 5000 : policy.intervalMs;

  function changeKind(kind: HistorianSamplingPolicy["kind"]) {
    if (kind === "interval") {
      onChange({ policy: { kind, intervalMs } });
      return;
    }
    const nextThreshold = numeric ? threshold ?? { kind: "percent" as const, value: 1 } : undefined;
    if (kind === "on-change") {
      onChange({ policy: { kind, ...(nextThreshold ? { threshold: nextThreshold } : {}) } });
      return;
    }
    onChange({
      policy: {
        kind,
        intervalMs,
        ...(nextThreshold ? { threshold: nextThreshold } : {}),
      },
    });
  }

  return (
    <Surface shadow="sm" padding="lg">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate font-mono text-sm font-semibold text-[var(--editor-text)]">{config.tagPath}</div>
          <div className="mt-1 text-[11px] text-[var(--editor-text-soft)]">{numeric ? "Numeric signal" : "Discrete signal"}</div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-[var(--editor-text-muted)]">
            <Checkbox checked={config.enabled} onChange={(event) => onChange({ enabled: event.target.checked })} /> Enabled
          </label>
          <Button variant="ghost" size="icon-sm" aria-label="Remove historian config" onClick={onDelete}>
            <DeleteIcon size={14} />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <FormField label="Sampling mode" compact>
          <Select controlSize="sm" value={policyKind} onChange={(event) => changeKind(event.target.value as HistorianSamplingPolicy["kind"])}>
            <option value="on-change">On change</option>
            <option value="interval">Fixed interval</option>
            <option value="on-change-or-interval">Change or interval</option>
          </Select>
        </FormField>

        {policyKind !== "interval" && numeric ? (
          <ThresholdEditor
            threshold={threshold ?? { kind: "percent", value: 1 }}
            onChange={(nextThreshold) => {
              if (policyKind === "on-change") onChange({ policy: { kind: policyKind, threshold: nextThreshold } });
              else onChange({ policy: { kind: policyKind, intervalMs, threshold: nextThreshold } });
            }}
          />
        ) : (
          <FormField label="Change rule" compact>
            <TextInput controlSize="sm" value={policyKind === "interval" ? "Not used" : "Any value change"} disabled />
          </FormField>
        )}

        {policyKind !== "on-change" ? (
          <FormField label="Interval" compact>
            <Select
              controlSize="sm"
              value={String(intervalMs)}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (policyKind === "interval") onChange({ policy: { kind: policyKind, intervalMs: next } });
                else onChange({ policy: { ...policy, intervalMs: next } });
              }}
            >
              <option value="1000">1 second</option>
              <option value="5000">5 seconds</option>
              <option value="10000">10 seconds</option>
              <option value="60000">1 minute</option>
              <option value="300000">5 minutes</option>
            </Select>
          </FormField>
        ) : (
          <FormField label="Interval" compact>
            <TextInput controlSize="sm" value="Event driven" disabled />
          </FormField>
        )}
      </div>
    </Surface>
  );
}

function ThresholdEditor({
  threshold,
  onChange,
}: {
  threshold: { kind: "percent" | "absolute"; value: number };
  onChange: (threshold: { kind: "percent" | "absolute"; value: number }) => void;
}) {
  return (
    <FormField label="Change threshold" compact>
      <div className="grid grid-cols-[1fr_96px] gap-2">
        <Select
          controlSize="sm"
          value={threshold.kind}
          onChange={(event) => onChange({ ...threshold, kind: event.target.value as "percent" | "absolute" })}
        >
          <option value="percent">Percent</option>
          <option value="absolute">Absolute</option>
        </Select>
        <TextInput
          controlSize="sm"
          type="number"
          min={0}
          step="0.1"
          value={threshold.value}
          onChange={(event) => onChange({ ...threshold, value: Math.max(0, Number(event.target.value) || 0) })}
        />
      </div>
    </FormField>
  );
}
