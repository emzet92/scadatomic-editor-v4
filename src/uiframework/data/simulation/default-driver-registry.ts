import { TagDriverRegistry } from "../drivers/DriverRegistry";
import { SimulationDriver } from "./SimulationDriver";

export function createDefaultTagDriverRegistry() {
  return new TagDriverRegistry().register({
    kind: "simulation",
    create: (context) => new SimulationDriver(context),
  });
}
