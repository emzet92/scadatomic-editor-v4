import type { SquareGeneratorConfig } from "../SimulationBinding";
import type { SimulationGeneratorDescriptor } from "../SimulationGenerator";

export const squareGenerator: SimulationGeneratorDescriptor<SquareGeneratorConfig> = {
  kind: "square",
  displayName: "Square",
  supportedTypes: ["int"],
  createDefault() {
    return { kind: "square", low: 0, high: 100, periodMs: 2000, dutyCycle: 0.5 };
  },
  validate(config) {
    if (!Number.isFinite(config.low) || !Number.isFinite(config.high)) return "Low and high must be finite numbers.";
    if (!Number.isFinite(config.periodMs) || config.periodMs <= 0) return "Period must be greater than 0.";
    if (!Number.isFinite(config.dutyCycle) || config.dutyCycle < 0 || config.dutyCycle > 1) return "Duty cycle must be between 0 and 1.";
    return null;
  },
  evaluate(context, config) {
    const phase = (context.elapsed % config.periodMs) / config.periodMs;
    return Math.round(phase < config.dutyCycle ? config.high : config.low);
  },
};
