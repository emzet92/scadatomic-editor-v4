import type { SimulationGeneratorDescriptor } from "../SimulationGenerator";
import type { ConstantGeneratorConfig } from "../SimulationBinding";

export const constantGenerator: SimulationGeneratorDescriptor<ConstantGeneratorConfig> = {
  kind: "constant",
  displayName: "Constant",
  supportedTypes: ["string", "int", "bool"],
  createDefault(type) {
    return {
      kind: "constant",
      value: type === "string" ? "" : type === "bool" ? false : 0,
    };
  },
  validate(config) {
    return ["string", "number", "boolean"].includes(typeof config.value)
      ? null
      : "Constant value must be a string, integer or boolean.";
  },
  evaluate(_context, config) {
    return config.value;
  },
};
