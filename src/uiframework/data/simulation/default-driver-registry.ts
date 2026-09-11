import { TagDriverRegistry } from "../drivers/DriverRegistry";
import { ManualTagDriver } from "../drivers/ManualTagDriver";
import { SimulationDriver } from "./SimulationDriver";

export function createDefaultTagDriverRegistry() {
  return new TagDriverRegistry()
    .register({
      kind: "manual",
      displayName: "Manual",
      description: "Value is controlled by the designer, scripts, or TagStore writes.",
      create: () => new ManualTagDriver(),
    })
    .register({
      kind: "simulation",
      displayName: "Simulation",
      description: "Value is generated locally by a configured simulation generator.",
      create: (context) => new SimulationDriver(context),
    });
}

/** Shared metadata/factory registry. Driver instances are still created per runtime. */
export const defaultTagDriverRegistry = createDefaultTagDriverRegistry();
