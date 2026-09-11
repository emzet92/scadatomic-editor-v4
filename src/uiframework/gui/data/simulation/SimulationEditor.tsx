import { Activity, GitBranch } from "lucide-react";
import type { ProjectData } from "../../../data/tags/TagDefinition";
import {
  listPrimitiveTagFieldRefs,
  resolveTagFieldRef,
  tagFieldRefKey,
  tagFieldRefsEqual,
  type TagFieldRef,
} from "../../../data/tags/TagFieldRef";
import type { PrimitiveDataType } from "../../../data/types/DataType";
import { TypeRegistry } from "../../../data/types/TypeRegistry";
import {
  createDefaultSimulationActivation,
  validateSimulationActivation,
  type SimulationActivation,
  type SimulationConditionOperator,
} from "../../../data/simulation/SimulationActivation";
import {
  findSimulationBinding,
  replaceSimulationGenerator,
  updateSimulationActivation,
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
import { DataValueInput } from "../DataValueInput";
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

  // The driver mapping owns creation/removal of the binding. If this is missing,
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

      <SimulationActivationEditor
        data={data}
        target={target}
        targetType={type}
        bindingId={stableBinding.id}
        activation={stableBinding.activation}
      />

      {!stableBinding.enabled ? (
        <div className="text-[10px] text-[var(--editor-text-soft)]">
          The Simulation driver is mapped, but this binding is disabled.
        </div>
      ) : null}
    </div>
  );
}

function SimulationActivationEditor({
  data,
  target,
  targetType,
  bindingId,
  activation,
}: {
  data: ProjectData;
  target: TagFieldRef;
  targetType: PrimitiveDataType;
  bindingId: string;
  activation: SimulationActivation | undefined;
}) {
  const updateProjectData = useEditorStore((state) => state.updateProjectData);
  const candidates = listPrimitiveTagFieldRefs(data).filter(
    (field) => !tagFieldRefsEqual(field.ref, target)
  );
  const source = activation
    ? resolveTagFieldRef(data, activation.condition.source)
    : undefined;
  const error = activation
    ? validateSimulationActivation(data, targetType, activation)
    : null;

  function enableCondition() {
    updateProjectData((current) => {
      const currentTarget = resolveTagFieldRef(current, target);
      if (!currentTarget) return current;
      const currentCandidates = listPrimitiveTagFieldRefs(current).filter(
        (field) => !tagFieldRefsEqual(field.ref, target)
      );
      const preferred =
        currentCandidates.find(
          (field) => field.ref.tagId === target.tagId && field.type.kind === "bool"
        ) ??
        currentCandidates.find((field) => field.type.kind === "bool") ??
        currentCandidates[0];
      if (!preferred) return current;
      return updateSimulationActivation(
        current,
        bindingId,
        createDefaultSimulationActivation(current, preferred.ref, currentTarget.type)
      );
    });
  }

  function disableCondition() {
    updateProjectData((current) =>
      updateSimulationActivation(current, bindingId, undefined)
    );
  }

  function setSource(key: string) {
    const nextSource = candidates.find((candidate) => tagFieldRefKey(candidate.ref) === key);
    if (!nextSource || !activation) return;
    updateProjectData((current) => {
      const currentTarget = resolveTagFieldRef(current, target);
      if (!currentTarget) return current;
      const defaults = createDefaultSimulationActivation(
        current,
        nextSource.ref,
        currentTarget.type
      );
      return updateSimulationActivation(current, bindingId, {
        ...activation,
        condition: defaults.condition,
      });
    });
  }

  function setOperator(operator: SimulationConditionOperator) {
    if (!activation) return;
    updateProjectData((current) =>
      updateSimulationActivation(current, bindingId, {
        ...activation,
        condition: { ...activation.condition, operator },
      })
    );
  }

  function setConditionValue(value: string | number | boolean) {
    if (!activation) return;
    updateProjectData((current) =>
      updateSimulationActivation(current, bindingId, {
        ...activation,
        condition: { ...activation.condition, value },
      })
    );
  }

  function setInactiveBehavior(kind: "hold" | "set") {
    if (!activation) return;
    updateProjectData((current) =>
      updateSimulationActivation(current, bindingId, {
        ...activation,
        inactiveBehavior:
          kind === "hold"
            ? { kind: "hold" }
            : {
                kind: "set",
                value:
                  activation.inactiveBehavior.kind === "set"
                    ? activation.inactiveBehavior.value
                    : TypeRegistry.getDefaultValue(targetType),
              },
      })
    );
  }

  function setInactiveValue(value: string | number | boolean) {
    if (!activation) return;
    updateProjectData((current) =>
      updateSimulationActivation(current, bindingId, {
        ...activation,
        inactiveBehavior: { kind: "set", value },
      })
    );
  }

  return (
    <div className="space-y-3 border-t border-[var(--editor-border)] pt-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--editor-text)]">
          <GitBranch size={12} className="text-[var(--editor-accent)]" /> Activation
        </div>
        <label className="flex items-center gap-2 text-[11px] text-[var(--editor-text-muted)]">
          <Checkbox
            checked={!!activation}
            disabled={!activation && candidates.length === 0}
            onChange={(event) =>
              event.target.checked ? enableCondition() : disableCondition()
            }
          />
          Conditional
        </label>
      </div>

      {!activation ? (
        <div className="text-[10px] leading-4 text-[var(--editor-text-soft)]">
          {candidates.length > 0
            ? "When enabled, this generator runs only while another tag field matches the configured condition."
            : "Create another primitive tag or UDT field to use as an activation source."}
        </div>
      ) : (
        <>
          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_110px_minmax(0,1fr)]">
            <FormField label="When" compact error={error}>
              <Select
                controlSize="sm"
                value={tagFieldRefKey(activation.condition.source)}
                onChange={(event) => setSource(event.target.value)}
              >
                {candidates.map((candidate) => (
                  <option key={tagFieldRefKey(candidate.ref)} value={tagFieldRefKey(candidate.ref)}>
                    {candidate.path}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Operator" compact>
              <Select
                controlSize="sm"
                value={activation.condition.operator}
                onChange={(event) =>
                  setOperator(event.target.value as SimulationConditionOperator)
                }
              >
                <option value="eq">is</option>
                <option value="neq">is not</option>
              </Select>
            </FormField>
            <FormField label="Value" compact>
              {source ? (
                <DataValueInput
                  compact
                  type={source.type}
                  value={activation.condition.value}
                  onChange={setConditionValue}
                />
              ) : null}
            </FormField>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <FormField label="When inactive" compact>
              <Select
                controlSize="sm"
                value={activation.inactiveBehavior.kind}
                onChange={(event) =>
                  setInactiveBehavior(event.target.value as "hold" | "set")
                }
              >
                <option value="set">Set value</option>
                <option value="hold">Hold last value</option>
              </Select>
            </FormField>
            {activation.inactiveBehavior.kind === "set" ? (
              <FormField label="Inactive value" compact>
                <DataValueInput
                  compact
                  type={targetType}
                  value={activation.inactiveBehavior.value}
                  onChange={setInactiveValue}
                />
              </FormField>
            ) : null}
          </div>
        </>
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
