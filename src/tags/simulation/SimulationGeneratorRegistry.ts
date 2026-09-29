import type { PrimitiveDataKind } from "../types/DataType";
import type { SimulationGeneratorConfig, SimulationGeneratorKind } from "./SimulationBinding";
import type { SimulationEvaluationContext, SimulationGeneratorDescriptor } from "./SimulationGenerator";
import {
  constantGenerator,
  randomGenerator,
  rampGenerator,
  sineGenerator,
  squareGenerator,
  toggleGenerator,
} from "./generators";

export class SimulationGeneratorRegistry {
  private readonly descriptors = new Map<SimulationGeneratorKind, SimulationGeneratorDescriptor>();

  register(descriptor: SimulationGeneratorDescriptor) {
    if (this.descriptors.has(descriptor.kind)) {
      throw new Error(`Simulation generator already registered: ${descriptor.kind}`);
    }
    this.descriptors.set(descriptor.kind, descriptor);
    return this;
  }

  get(kind: SimulationGeneratorKind) {
    return this.descriptors.get(kind);
  }

  listForType(type: PrimitiveDataKind) {
    return [...this.descriptors.values()].filter((descriptor) =>
      descriptor.supportedTypes.includes(type)
    );
  }

  createDefault(kind: SimulationGeneratorKind, type: PrimitiveDataKind) {
    const descriptor = this.require(kind);
    if (!descriptor.supportedTypes.includes(type)) {
      throw new Error(`${descriptor.displayName} does not support ${type}.`);
    }
    return descriptor.createDefault(type);
  }

  validate(config: SimulationGeneratorConfig) {
    const descriptor = this.descriptors.get(config.kind);
    if (!descriptor) return `Unknown simulation generator: ${config.kind}`;
    return descriptor.validate(config as never);
  }

  evaluate(context: SimulationEvaluationContext, config: SimulationGeneratorConfig) {
    const descriptor = this.require(config.kind);
    return descriptor.evaluate(context, config as never);
  }

  supports(kind: SimulationGeneratorKind, type: PrimitiveDataKind) {
    return this.descriptors.get(kind)?.supportedTypes.includes(type) ?? false;
  }

  private require(kind: SimulationGeneratorKind) {
    const descriptor = this.descriptors.get(kind);
    if (!descriptor) throw new Error(`Unknown simulation generator: ${kind}`);
    return descriptor;
  }
}

export const simulationGeneratorRegistry = new SimulationGeneratorRegistry()
  .register(constantGenerator as SimulationGeneratorDescriptor)
  .register(sineGenerator as SimulationGeneratorDescriptor)
  .register(rampGenerator as SimulationGeneratorDescriptor)
  .register(squareGenerator as SimulationGeneratorDescriptor)
  .register(randomGenerator as SimulationGeneratorDescriptor)
  .register(toggleGenerator as SimulationGeneratorDescriptor);
