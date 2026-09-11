import type { SineGeneratorConfig } from "../SimulationBinding";
import type { SimulationGeneratorDescriptor } from "../SimulationGenerator";

export const sineGenerator: SimulationGeneratorDescriptor<SineGeneratorConfig> = {
  kind: "sine",
  displayName: "Sine",
  supportedTypes: ["int"],
  createDefault() {
    return { kind: "sine", min: 0, max: 100, periodMs: 5000, phase: 0 };
  },
  validate(config) {
    if (!Number.isFinite(config.min) || !Number.isFinite(config.max)) return "Min and max must be finite numbers.";
    if (config.min > config.max) return "Min must be less than or equal to max.";
    if (!Number.isFinite(config.periodMs) || config.periodMs <= 0) return "Period must be greater than 0.";
    if (!Number.isFinite(config.phase)) return "Phase must be a finite number.";
    return null;
  },
  evaluate(context, config) {
    const center = (config.min + config.max) / 2;
    const amplitude = (config.max - config.min) / 2;
    const phaseRadians = (config.phase * Math.PI) / 180;
    const angle = (context.elapsed / config.periodMs) * Math.PI * 2 + phaseRadians;
    return Math.round(center - Math.cos(angle) * amplitude);
  },
};
