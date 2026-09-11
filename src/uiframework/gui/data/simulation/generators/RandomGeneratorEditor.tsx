import type { RandomGeneratorConfig } from "../../../../data/simulation/SimulationBinding";
import { FormField, TextInput } from "../../../ui";
import type { GeneratorEditorProps } from "./GeneratorEditorProps";
import { msToSeconds, secondsToMs } from "./GeneratorEditorProps";

export function RandomGeneratorEditor({ config, onChange }: GeneratorEditorProps<RandomGeneratorConfig>) {
  return <div className="grid gap-2 md:grid-cols-4">
    <NumberField label="Min" value={config.min} onChange={(min) => onChange({ ...config, min })} />
    <NumberField label="Max" value={config.max} onChange={(max) => onChange({ ...config, max })} />
    <FormField label="Interval (s)" compact><TextInput controlSize="sm" type="number" min="0.001" step="0.1" value={msToSeconds(config.intervalMs)} onChange={(event) => onChange({ ...config, intervalMs: secondsToMs(event.target.value) })} /></FormField>
    <FormField label="Seed" compact><TextInput controlSize="sm" type="number" placeholder="auto" value={config.seed ?? ""} onChange={(event) => onChange({ ...config, seed: event.target.value === "" ? undefined : Number(event.target.value) })} /></FormField>
  </div>;
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange(value: number): void }) {
  return <FormField label={label} compact><TextInput controlSize="sm" type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} /></FormField>;
}
