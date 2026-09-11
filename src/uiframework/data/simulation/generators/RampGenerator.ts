import type { RampGeneratorConfig } from "../SimulationBinding";
import type { SimulationGeneratorDescriptor } from "../SimulationGenerator";

export const rampGenerator: SimulationGeneratorDescriptor<RampGeneratorConfig> = {
  kind: "ramp",
  displayName: "Ramp",
  supportedTypes: ["int"],
  createDefault() {
    return { kind: "ramp", min: 0, max: 100, durationMs: 5000, mode: "pingPong" };
  },
  validate(config) {
    if (!Number.isFinite(config.min) || !Number.isFinite(config.max)) return "Min and max must be finite numbers.";
    if (config.min > config.max) return "Min must be less than or equal to max.";
    if (!Number.isFinite(config.durationMs) || config.durationMs <= 0) return "Duration must be greater than 0.";
    return config.mode === "loop" || config.mode === "pingPong" ? null : "Unknown ramp mode.";
  },
  evaluate(context, config) {
    const normalized = context.elapsed / config.durationMs;
    let progress: number;
    if (config.mode === "loop") {
      progress = normalized - Math.floor(normalized);
    } else {
      const segment = Math.floor(normalized);
      const fraction = normalized - segment;
      progress = segment % 2 === 0 ? fraction : 1 - fraction;
    }
    return Math.round(config.min + (config.max - config.min) * progress);
  },
};
