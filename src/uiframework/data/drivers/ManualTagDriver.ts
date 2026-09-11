import type { TagDriver } from "./TagDriver";

/**
 * Explicit no-op source used by the designer when a tag is controlled manually.
 * Keeping it as a real driver descriptor means the Source picker can be driven by
 * the same registry as future Modbus / OPC UA / MQTT drivers.
 */
export class ManualTagDriver implements TagDriver {
  readonly kind = "manual";

  start() {}
  stop() {}
  dispose() {}

  isRunning() {
    return false;
  }
}
