import type { SquareGeneratorConfig } from "../../../../data/simulation/SimulationBinding";
import { FormField, TextInput } from "../../../ui";
import type { GeneratorEditorProps } from "./GeneratorEditorProps";
import { msToSeconds, secondsToMs } from "./GeneratorEditorProps";

export function SquareGeneratorEditor({ config, onChange }: GeneratorEditorProps<SquareGeneratorConfig>) {
  return <div className="grid gap-2 md:grid-cols-4">
    <NumberField label="Low" value={config.low} onChange={(low) => onChange({ ...config, low })} />
    <NumberField label="High" value={config.high} onChange={(high) => onChange({ ...config, high })} />
    <FormField label="Period (s)" compact><TextInput controlSize="sm" type="number" min="0.001" step="0.1" value={msToSeconds(config.periodMs)} onChange={(event) => onChange({ ...config, periodMs: secondsToMs(event.target.value) })} /></FormField>
    <FormField label="Duty (%)" compact><TextInput controlSize="sm" type="number" min="0" max="100" value={Math.round(config.dutyCycle * 100)} onChange={(event) => onChange({ ...config, dutyCycle: Number(event.target.value) / 100 })} /></FormField>
  </div>;
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange(value: number): void }) {
  return <FormField label={label} compact><TextInput controlSize="sm" type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} /></FormField>;
}
