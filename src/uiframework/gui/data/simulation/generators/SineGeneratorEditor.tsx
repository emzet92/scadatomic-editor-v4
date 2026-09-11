import type { SineGeneratorConfig } from "../../../../data/simulation/SimulationBinding";
import { FormField, TextInput } from "../../../ui";
import type { GeneratorEditorProps } from "./GeneratorEditorProps";
import { msToSeconds, secondsToMs } from "./GeneratorEditorProps";

export function SineGeneratorEditor({ config, onChange }: GeneratorEditorProps<SineGeneratorConfig>) {
  return <div className="grid gap-2 md:grid-cols-4">
    <NumberField label="Min" value={config.min} onChange={(min) => onChange({ ...config, min })} />
    <NumberField label="Max" value={config.max} onChange={(max) => onChange({ ...config, max })} />
    <FormField label="Period (s)" compact><TextInput controlSize="sm" type="number" min="0.001" step="0.1" value={msToSeconds(config.periodMs)} onChange={(event) => onChange({ ...config, periodMs: secondsToMs(event.target.value) })} /></FormField>
    <NumberField label="Phase (°)" value={config.phase} onChange={(phase) => onChange({ ...config, phase })} />
  </div>;
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange(value: number): void }) {
  return <FormField label={label} compact><TextInput controlSize="sm" type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} /></FormField>;
}
