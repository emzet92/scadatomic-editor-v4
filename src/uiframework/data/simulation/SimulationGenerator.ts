import type { PrimitiveDataKind } from "../types/DataType";
import type {
  SimulationGeneratorConfig,
  SimulationGeneratorKind,
} from "./SimulationBinding";

export type SimulationEvaluationContext = {
  now: number;
  elapsed: number;
  delta: number;
  currentValue: unknown;
  bindingId: string;
  path: string;
};

export type SimulationGeneratorDescriptor<
  TConfig extends SimulationGeneratorConfig = SimulationGeneratorConfig,
> = {
  kind: SimulationGeneratorKind;
  displayName: string;
  supportedTypes: readonly PrimitiveDataKind[];
  createDefault(type: PrimitiveDataKind): TConfig;
  validate(config: TConfig): string | null;
  evaluate(context: SimulationEvaluationContext, config: TConfig): unknown;
};
