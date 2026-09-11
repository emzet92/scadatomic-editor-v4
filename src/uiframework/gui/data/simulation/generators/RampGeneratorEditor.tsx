import type { RampGeneratorConfig } from "../../../../data/simulation/SimulationBinding";
import { FormField, Select, TextInput } from "../../../ui";
import type { GeneratorEditorProps } from "./GeneratorEditorProps";
import { msToSeconds, secondsToMs } from "./GeneratorEditorProps";

export function RampGeneratorEditor({ config, onChange }: GeneratorEditorProps<RampGeneratorConfig>) {
  return <div className="grid gap-2 md:grid-cols-4">
    <NumberField label="Min" value={config.min} onChange={(min) => onChange({ ...config, min })} />
    <NumberField label="Max" value={config.max} onChange={(max) => onChange({ ...config, max })} />
    <FormField label="Duration (s)" compact><TextInput controlSize="sm" type="number" min="0.001" step="0.1" value={msToSeconds(config.durationMs)} onChange={(event) => onChange({ ...config, durationMs: secondsToMs(event.target.value) })} /></FormField>
    <FormField label="Mode" compact><Select controlSize="sm" value={config.mode} onChange={(event) => onChange({ ...config, mode: event.target.value as RampGeneratorConfig["mode"] })}><option value="loop">Loop</option><option value="pingPong">Ping pong</option></Select></FormField>
  </div>;
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange(value: number): void }) {
  return <FormField label={label} compact><TextInput controlSize="sm" type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} /></FormField>;
}
