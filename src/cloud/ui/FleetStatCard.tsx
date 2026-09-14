import type { LucideIcon } from "lucide-react";
import { cx } from "../../uiframework/gui/ui";

export function FleetStatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: LucideIcon;
  tone?: "neutral" | "success" | "danger" | "accent";
}) {
  return (
    <div className="rounded-xl border border-[var(--editor-border)] bg-[var(--editor-surface)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-[var(--editor-text-muted)]">{label}</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-[var(--editor-text)]">
            {value}
          </div>
        </div>
        <div
          className={cx(
            "flex size-9 items-center justify-center rounded-lg",
            tone === "success" && "bg-green-50 text-green-700",
            tone === "danger" && "bg-red-50 text-red-700",
            tone === "accent" && "bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]",
            tone === "neutral" && "bg-[var(--editor-surface-muted)] text-[var(--editor-text-muted)]"
          )}
        >
          <Icon size={17} strokeWidth={1.8} />
        </div>
      </div>
      <div className="mt-3 text-[11px] text-[var(--editor-text-soft)]">{detail}</div>
    </div>
  );
}
