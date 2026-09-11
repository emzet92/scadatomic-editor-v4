import { Activity } from "lucide-react";
import type { ProjectData } from "../../../data/tags/TagDefinition";
import type { TagFieldRef } from "../../../data/tags/TagFieldRef";
import type { PrimitiveDataType } from "../../../data/types/DataType";
import {
  createSimulationBinding,
  findSimulationBinding,
  replaceSimulationGenerator,
  updateSimulationBinding,
  updateSimulationGenerator,
  upsertSimulationBinding,
} from "../../../data/simulation/SimulationRegistry";
import { simulationGeneratorRegistry } from "../../../data/simulation/SimulationGeneratorRegistry";
import type { SimulationGeneratorConfig, SimulationGeneratorKind } from "../../../data/simulation/SimulationBinding";
import { useEditorStore } from "../../../editor-store";
import { Checkbox, FormField, Select } from "../../ui";
import {
  ConstantGeneratorEditor,
  RandomGeneratorEditor,
  RampGeneratorEditor,
  SineGeneratorEditor,
  SquareGeneratorEditor,
  ToggleGeneratorEditor,
} from "./generators";

export function SimulationEditor({
  data,
  target,
  type,
}: {
  data: ProjectData;
  target: TagFieldRef;
  type: PrimitiveDataType;
}) {
  const updateProjectData = useEditorStore((state) => state.updateProjectData);
  const binding = findSimulationBinding(data, target);
  const descriptors = simulationGeneratorRegistry.listForType(type.kind);
  const validationError = binding
    ? simulationGeneratorRegistry.validate(binding.generator)
    : null;

  function setEnabled(enabled: boolean) {
    updateProjectData((current) => {
      const existing = findSimulationBinding(current, target);
      if (existing) {
        return updateSimulationBinding(current, existing.id, (candidate) => ({
          ...candidate,
          enabled,
        }));
      }
      if (!enabled) return current;
      return upsertSimulationBinding(current, createSimulationBinding(current, target));
    });
  }

  function setGeneratorKind(kind: SimulationGeneratorKind) {
    if (!binding) return;
    updateProjectData((current) => replaceSimulationGenerator(current, binding.id, kind));
  }

  function setGenerator(generator: SimulationGeneratorConfig) {
    if (!binding) return;
    updateProjectData((current) => updateSimulationGenerator(current, binding.id, generator));
  }

  return (
    <div className="space-y-3 rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--editor-text)]">
          <Activity size={13} className="text-[var(--editor-accent)]" /> Simulation
        </div>
        <label className="flex items-center gap-2 text-[11px] text-[var(--editor-text-muted)]">
          <Checkbox checked={binding?.enabled ?? false} onChange={(event) => setEnabled(event.target.checked)} />
          Enabled
        </label>
      </div>

      {binding ? (
        <>
          <FormField label="Generator" compact error={validationError}>
            <Select
              controlSize="sm"
              value={binding.generator.kind}
              onChange={(event) => setGeneratorKind(event.target.value as SimulationGeneratorKind)}
            >
              {descriptors.map((descriptor) => (
                <option key={descriptor.kind} value={descriptor.kind}>{descriptor.displayName}</option>
              ))}
            </Select>
          </FormField>
          <GeneratorConfigEditor type={type} config={binding.generator} onChange={setGenerator} />
          {!binding.enabled ? (
            <div className="text-[10px] text-[var(--editor-text-soft)]">Configuration is saved, but this binding is disabled.</div>
          ) : null}
        </>
      ) : (
        <div className="text-[10px] leading-4 text-[var(--editor-text-soft)]">
          Enable simulation to attach a local driver generator to this tag path.
        </div>
      )}
    </div>
  );
}

function GeneratorConfigEditor({
  type,
  config,
  onChange,
}: {
  type: PrimitiveDataType;
  config: SimulationGeneratorConfig;
  onChange(config: SimulationGeneratorConfig): void;
}) {
  switch (config.kind) {
    case "constant":
      return <ConstantGeneratorEditor type={type} config={config} onChange={onChange} />;
    case "sine":
      return <SineGeneratorEditor type={type} config={config} onChange={onChange} />;
    case "ramp":
      return <RampGeneratorEditor type={type} config={config} onChange={onChange} />;
    case "square":
      return <SquareGeneratorEditor type={type} config={config} onChange={onChange} />;
    case "random":
      return <RandomGeneratorEditor type={type} config={config} onChange={onChange} />;
    case "toggle":
      return <ToggleGeneratorEditor type={type} config={config} onChange={onChange} />;
  }
}
