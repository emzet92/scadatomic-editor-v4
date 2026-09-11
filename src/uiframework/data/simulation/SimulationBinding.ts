import type { TagFieldRef } from "../tags/TagFieldRef";
import type { SimulationActivation } from "./SimulationActivation";

export type ConstantGeneratorConfig = {
  kind: "constant";
  value: string | number | boolean;
};

export type SineGeneratorConfig = {
  kind: "sine";
  min: number;
  max: number;
  periodMs: number;
  phase: number;
};

export type RampGeneratorConfig = {
  kind: "ramp";
  min: number;
  max: number;
  durationMs: number;
  mode: "loop" | "pingPong";
};

export type SquareGeneratorConfig = {
  kind: "square";
  low: number;
  high: number;
  periodMs: number;
  dutyCycle: number;
};

export type RandomGeneratorConfig = {
  kind: "random";
  min: number;
  max: number;
  intervalMs: number;
  seed?: number | undefined;
};

export type ToggleGeneratorConfig = {
  kind: "toggle";
  intervalMs: number;
  initialValue: boolean;
};

export type SimulationGeneratorConfig =
  | ConstantGeneratorConfig
  | SineGeneratorConfig
  | RampGeneratorConfig
  | SquareGeneratorConfig
  | RandomGeneratorConfig
  | ToggleGeneratorConfig;

export type SimulationGeneratorKind = SimulationGeneratorConfig["kind"];

export type SimulationBinding = {
  id: string;
  driver: "simulation";
  target: TagFieldRef;
  enabled: boolean;
  generator: SimulationGeneratorConfig;
  /** Optional Simulation-only gate. The generator runs only while the condition is true. */
  activation?: SimulationActivation | undefined;
};

export type SimulationProjectConfig = {
  bindings: Record<string, SimulationBinding>;
};

export function createEmptySimulationConfig(): SimulationProjectConfig {
  return { bindings: {} };
}
