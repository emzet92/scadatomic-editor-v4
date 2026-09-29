import type { ConstantGeneratorConfig } from "../../../../../tags/simulation/SimulationBinding";
import { FormField } from "../../../../../shared/ui";
import { DataValueInput } from "../../DataValueInput";
import type { GeneratorEditorProps } from "./GeneratorEditorProps";

export function ConstantGeneratorEditor({ config, type, onChange }: GeneratorEditorProps<ConstantGeneratorConfig>) {
  return (
    <FormField label="Value">
      <DataValueInput
        compact
        type={type}
        value={config.value}
        onChange={(value) => onChange({ ...config, value })}
      />
    </FormField>
  );
}
