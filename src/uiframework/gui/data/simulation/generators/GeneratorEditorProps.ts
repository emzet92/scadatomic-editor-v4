import type { PrimitiveDataType } from "../../../../data/types/DataType";
import type { SimulationGeneratorConfig } from "../../../../data/simulation/SimulationBinding";

export type GeneratorEditorProps<TConfig extends SimulationGeneratorConfig> = {
  config: TConfig;
  type: PrimitiveDataType;
  onChange(config: TConfig): void;
};

export function secondsToMs(value: string) {
  const seconds = Number(value);
  return Number.isFinite(seconds) ? Math.max(0, seconds * 1000) : 0;
}

export function msToSeconds(value: number) {
  return value / 1000;
}
