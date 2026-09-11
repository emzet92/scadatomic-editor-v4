import type { ToggleGeneratorConfig } from "../../../../data/simulation/SimulationBinding";
import { Checkbox, FormField, TextInput } from "../../../ui";
import type { GeneratorEditorProps } from "./GeneratorEditorProps";
import { msToSeconds, secondsToMs } from "./GeneratorEditorProps";

export function ToggleGeneratorEditor({ config, onChange }: GeneratorEditorProps<ToggleGeneratorConfig>) {
  return <div className="grid gap-2 md:grid-cols-2">
    <FormField label="Interval (s)" compact><TextInput controlSize="sm" type="number" min="0.001" step="0.1" value={msToSeconds(config.intervalMs)} onChange={(event) => onChange({ ...config, intervalMs: secondsToMs(event.target.value) })} /></FormField>
    <FormField label="Initial value" compact><label className="flex h-8 items-center gap-2 rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface)] px-2.5 text-xs text-[var(--editor-text)]"><Checkbox checked={config.initialValue} onChange={(event) => onChange({ ...config, initialValue: event.target.checked })} /> {config.initialValue ? "True" : "False"}</label></FormField>
  </div>;
}
