import type { RandomGeneratorConfig } from "../SimulationBinding";
import type { SimulationGeneratorDescriptor } from "../SimulationGenerator";

export const randomGenerator: SimulationGeneratorDescriptor<RandomGeneratorConfig> = {
  kind: "random",
  displayName: "Random",
  supportedTypes: ["int"],
  createDefault() {
    return { kind: "random", min: 0, max: 100, intervalMs: 1000 };
  },
  validate(config) {
    if (!Number.isFinite(config.min) || !Number.isFinite(config.max)) return "Min and max must be finite numbers.";
    if (config.min > config.max) return "Min must be less than or equal to max.";
    if (!Number.isFinite(config.intervalMs) || config.intervalMs <= 0) return "Interval must be greater than 0.";
    if (config.seed !== undefined && !Number.isFinite(config.seed)) return "Seed must be a finite number.";
    return null;
  },
  evaluate(context, config) {
    const bucket = Math.floor(context.elapsed / config.intervalMs);
    const seed = config.seed ?? 0;
    const value = deterministicUnit(`${context.bindingId}:${seed}:${bucket}`);
    return Math.round(config.min + (config.max - config.min) * value);
  },
};

function deterministicUnit(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0xffffffff;
}
