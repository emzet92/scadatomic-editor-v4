import { defaultTagDriverRegistry } from "../../data/simulation/default-driver-registry";
import {
  Box,
  CableIcon,
  GaugeIcon,
  HandIcon,
  SidebarNavItem,
  SidebarSection
} from "../ui";
import type { DataSelection } from "./data-selection";

function DriverIcon({ kind }: { kind: string }) {
  if (kind === "simulation") return <GaugeIcon size={13} />;
  if (kind === "manual") return <HandIcon size={13} />;
  return <CableIcon size={13} />;
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
    <SidebarSection title="Drivers">
      <Box className="space-y-0.5">
        {drivers.map((driver) => {
          const active = selection?.kind === "driver" && selection.driverKind === driver.kind;
          return (
            <SidebarNavItem
              key={driver.kind}
              variant="row"
              active={active}
              icon={<DriverIcon kind={driver.kind} />}
              title={driver.displayName}
              description={driver.kind === "manual" ? "Built in · default source" : "Built in · configurable"}
              onClick={() => onSelect({ kind: "driver", driverKind: driver.kind })}
            />
          );
        })}
      </Box>
    </SidebarSection>
  );
}
