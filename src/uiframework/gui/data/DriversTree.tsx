import { Cable, Gauge, Hand } from "lucide-react";
import { defaultTagDriverRegistry } from "../../data/simulation/default-driver-registry";
import type { DataSelection } from "./data-selection";

function DriverIcon({ kind }: { kind: string }) {
  if (kind === "simulation") return <Gauge size={13} />;
  if (kind === "manual") return <Hand size={13} />;
  return <Cable size={13} />;
}

export function DriversTree({
  selection,
  onSelect,
}: {
  selection: DataSelection;
  onSelect(selection: DataSelection): void;
}) {
  const drivers = defaultTagDriverRegistry.list();

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--editor-text-muted)]">
        Drivers
      </div>
      <div className="space-y-0.5">
        {drivers.map((driver) => {
          const active = selection?.kind === "driver" && selection.driverKind === driver.kind;
          return (
            <button
              key={driver.kind}
              type="button"
              onClick={() => onSelect({ kind: "driver", driverKind: driver.kind })}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs transition ${
                active
                  ? "bg-[var(--editor-accent-soft)] text-[var(--editor-accent)]"
                  : "text-[var(--editor-text)] hover:bg-[var(--editor-surface)]"
              }`}
            >
              <DriverIcon kind={driver.kind} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{driver.displayName}</span>
                <span className="mt-0.5 block truncate text-[10px] text-[var(--editor-text-soft)]">
                  {driver.kind === "manual" ? "Built in · default source" : "Built in · configurable"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
