import { Activity } from "lucide-react";
import type { ProjectData } from "../../../data/tags/TagDefinition";
import type { TagFieldRef } from "../../../data/tags/TagFieldRef";
import type { PrimitiveDataType } from "../../../data/types/DataType";
import {
  findSimulationBinding,
  replaceSimulationGenerator,
  updateSimulationBinding,
  updateSimulationGenerator,
} from "../../../data/simulation/SimulationRegistry";
import { simulationGeneratorRegistry } from "../../../data/simulation/SimulationGeneratorRegistry";
import type {
  SimulationGeneratorConfig,
  SimulationGeneratorKind,
} from "../../../data/simulation/SimulationBinding";
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

  // The Source editor owns creation/removal of the mapping. If this is missing,
  // the project changed between renders; render nothing rather than creating
  // configuration as a render side effect.
  if (!binding) return null;
  const stableBinding = binding;

  function setEnabled(enabled: boolean) {
    updateProjectData((current) =>
      updateSimulationBinding(current, stableBinding.id, (candidate) => ({
        ...candidate,
        enabled,
      }))
    );
  }

  function setGeneratorKind(kind: SimulationGeneratorKind) {
    updateProjectData((current) =>
      replaceSimulationGenerator(current, stableBinding.id, kind)
    );
  }

  function setGenerator(generator: SimulationGeneratorConfig) {
    updateProjectData((current) =>
      updateSimulationGenerator(current, stableBinding.id, generator)
    );
  }

  return (
    <div className="space-y-3 border-t border-[var(--editor-border)] pt-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--editor-text)]">
          <Activity size={12} className="text-[var(--editor-accent)]" /> Simulation configuration
        </div>
        <label className="flex items-center gap-2 text-[11px] text-[var(--editor-text-muted)]">
          <Checkbox
            checked={stableBinding.enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          Enabled
        </label>
      </div>

      <FormField label="Generator" compact error={validationError}>
        <Select
          controlSize="sm"
          value={stableBinding.generator.kind}
          onChange={(event) =>
            setGeneratorKind(event.target.value as SimulationGeneratorKind)
          }
        >
          {descriptors.map((descriptor) => (
            <option key={descriptor.kind} value={descriptor.kind}>
              {descriptor.displayName}
            </option>
          ))}
        </Select>
      </FormField>

      <GeneratorConfigEditor
        type={type}
        config={stableBinding.generator}
        onChange={setGenerator}
      />

      {!stableBinding.enabled ? (
        <div className="text-[10px] text-[var(--editor-text-soft)]">
          The Simulation driver is mapped, but this binding is disabled.
        </div>
      ) : null}
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
