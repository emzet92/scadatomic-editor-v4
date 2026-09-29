import type { ToggleGeneratorConfig } from "../SimulationBinding";
import type { SimulationGeneratorDescriptor } from "../SimulationGenerator";

export const toggleGenerator: SimulationGeneratorDescriptor<ToggleGeneratorConfig> = {
  kind: "toggle",
  displayName: "Toggle",
  supportedTypes: ["bool"],
  createDefault() {
    return { kind: "toggle", intervalMs: 1000, initialValue: false };
  },
  validate(config) {
    return Number.isFinite(config.intervalMs) && config.intervalMs > 0
      ? null
      : "Interval must be greater than 0.";
  },
  evaluate(context, config) {
    const step = Math.floor(context.elapsed / config.intervalMs);
    return step % 2 === 0 ? config.initialValue : !config.initialValue;
  },
};
