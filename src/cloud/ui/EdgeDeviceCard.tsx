import { Cpu, HardDrive, MapPin, MemoryStick, Radio, Server } from "lucide-react";
import type { EdgeDevice } from "../model/fleet";
import { cx } from "../../uiframework/gui/ui";

export function EdgeDeviceCard({ device }: { device: EdgeDevice }) {
  return (
    <article className="rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-4 shadow-sm transition hover:border-[var(--editor-accent-border)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--editor-surface-muted)] text-[var(--editor-text-muted)]">
              <Server size={17} />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-[var(--editor-text)]">
                {device.name}
              </h3>
              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[var(--editor-text-soft)]">
                <MapPin size={11} />
                {device.location}
              </div>
            </div>
          </div>
        </div>
        <StatusBadge status={device.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
        <Metadata label="Hostname" value={device.hostname} />
        <Metadata label="IP address" value={device.ipAddress} mono />
        <Metadata label="Agent" value={device.agentVersion} />
        <Metadata label="Runtime" value={device.runtimeVersion} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Metric icon={Cpu} label="CPU" value={device.metrics.cpuPercent} />
        <Metric icon={MemoryStick} label="Memory" value={device.metrics.memoryPercent} />
        <Metric icon={HardDrive} label="Disk" value={device.metrics.diskPercent} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-[var(--editor-border)] pt-3">
        {device.labels.map((label) => (
          <span
            key={label}
            className="rounded-md bg-[var(--editor-surface-muted)] px-2 py-1 text-[9px] font-medium text-[var(--editor-text-muted)]"
          >
            {label}
          </span>
        ))}
        <span className="ml-auto inline-flex items-center gap-1 text-[9px] text-[var(--editor-text-soft)]">
          <Radio size={10} />
          {formatLastSeen(device.lastSeenAt)}
        </span>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: EdgeDevice["status"] }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold",
        status === "online" && "bg-green-50 text-green-700",
        status === "offline" && "bg-red-50 text-red-700",
        status === "provisioning" && "bg-amber-50 text-amber-700"
      )}
    >
      <span
        className={cx(
          "size-1.5 rounded-full",
          status === "online" && "bg-green-500",
          status === "offline" && "bg-red-500",
          status === "provisioning" && "bg-amber-500"
        )}
      />
      {status === "online" ? "Online" : status === "offline" ? "Offline" : "Provisioning"}
    </span>
  );
}

function Metadata({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] uppercase tracking-wide text-[var(--editor-text-soft)]">{label}</div>
      <div className={cx("mt-0.5 truncate text-[var(--editor-text-muted)]", mono && "font-mono")}>{value}</div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Cpu;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] p-2.5">
      <div className="flex items-center justify-between gap-2 text-[9px] text-[var(--editor-text-muted)]">
        <span className="inline-flex items-center gap-1">
          <Icon size={11} />
          {label}
        </span>
        <span>{value}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--editor-border)]">
        <div
          className="h-full rounded-full bg-[var(--editor-accent)] transition-all"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

function formatLastSeen(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60_000));
  if (minutes < 1) return "seen now";
  if (minutes < 60) return `seen ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `seen ${hours}h ago`;
  return `seen ${Math.floor(hours / 24)}d ago`;
}
