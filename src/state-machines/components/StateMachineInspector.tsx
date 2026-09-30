import { Copy, Trash2 } from "lucide-react";
import { Button, FormField, PanelCard, SectionHeader, TextInput } from "../../shared/ui";
import type { StateDefinition, StateMachineDefinition, TransitionDefinition } from "../domain/state-machine-definition";
import type { MachineSelection } from "./StateMachineCanvas";
import { ActionBlockList, TransitionScratchEditor } from "./ScratchBlocks";

export function StateMachineInspector({
  definition,
  selection,
  tagPaths,
  onDefinitionChange,
  onDeleteState,
  onDeleteTransition,
}: {
  definition: StateMachineDefinition;
  selection: MachineSelection;
  tagPaths: string[];
  onDefinitionChange: (definition: StateMachineDefinition) => void;
  onDeleteState: (stateId: string) => void;
  onDeleteTransition: (transitionId: string) => void;
}) {
  if (!selection) {
    return (
      <div className="space-y-4">
        <PanelCard className="p-4">
          <SectionHeader title="Machine" description="Graph and code are two views of the same AST." />
          <div className="mt-4 space-y-3">
            <FormField label="Name">
              <TextInput value={definition.name} onChange={(event) => onDefinitionChange({ ...definition, name: event.target.value })} />
            </FormField>
            <FormField label="Description">
              <TextInput value={definition.description ?? ""} onChange={(event) => onDefinitionChange({ ...definition, description: event.target.value })} />
            </FormField>
          </div>
        </PanelCard>
        <JsApiCard definition={definition} />
      </div>
    );
  }

  if (selection.kind === "state") {
    const state = definition.states[selection.id];
    if (!state) return null;
    return (
      <StateInspector
        definition={definition}
        state={state}
        tagPaths={tagPaths}
        onChange={(nextState) => onDefinitionChange({ ...definition, states: { ...definition.states, [nextState.id]: nextState } })}
        onSetInitial={() => onDefinitionChange({ ...definition, initialStateId: state.id })}
        onDelete={() => onDeleteState(state.id)}
      />
    );
  }

  const transition = definition.transitions.find((item) => item.id === selection.id);
  if (!transition) return null;
  return (
    <TransitionInspector
      definition={definition}
      transition={transition}
      tagPaths={tagPaths}
      onChange={(nextTransition) => onDefinitionChange({
        ...definition,
        transitions: definition.transitions.map((item) => item.id === nextTransition.id ? nextTransition : item),
      })}
      onDelete={() => onDeleteTransition(transition.id)}
    />
  );
}

function StateInspector({ definition, state, tagPaths, onChange, onSetInitial, onDelete }: {
  definition: StateMachineDefinition;
  state: StateDefinition;
  tagPaths: string[];
  onChange: (state: StateDefinition) => void;
  onSetInitial: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-4">
      <PanelCard className="p-4">
        <SectionHeader title="State block" description="Actions run deterministically when the state is entered or exited." />
        <div className="mt-4 space-y-3">
          <FormField label="State name"><TextInput value={state.name} onChange={(event) => onChange({ ...state, name: event.target.value })} /></FormField>
          <div className="flex gap-2">
            <Button size="xs" variant={definition.initialStateId === state.id ? "primary" : "secondary"} onClick={onSetInitial}>
              {definition.initialStateId === state.id ? "Initial state" : "Set initial"}
            </Button>
            <Button size="xs" variant="danger" onClick={onDelete}><Trash2 size={12} /> Delete</Button>
          </div>
        </div>
      </PanelCard>

      <PanelCard className="p-4">
        <SectionHeader title="When entering" description="Scratch-like action blocks." />
        <div className="mt-4">
          <ActionBlockList actions={state.onEnter} tagPaths={tagPaths} label="ON ENTER" onChange={(onEnter) => onChange({ ...state, onEnter })} />
        </div>
      </PanelCard>

      <PanelCard className="p-4">
        <SectionHeader title="When leaving" />
        <div className="mt-4">
          <ActionBlockList actions={state.onExit} tagPaths={tagPaths} label="ON EXIT" onChange={(onExit) => onChange({ ...state, onExit })} />
        </div>
      </PanelCard>
    </div>
  );
}

function TransitionInspector({ definition, transition, tagPaths, onChange, onDelete }: {
  definition: StateMachineDefinition;
  transition: TransitionDefinition;
  tagPaths: string[];
  onChange: (transition: TransitionDefinition) => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-4">
      <PanelCard className="p-4">
        <div className="flex items-start justify-between gap-3">
          <SectionHeader title="Transition script" description="WHEN → IF → THEN → GO TO. The blocks compile directly to the state-machine AST." />
          <Button size="icon-xs" variant="danger" aria-label="Delete transition" onClick={onDelete}><Trash2 size={13} /></Button>
        </div>
        <div className="mt-4 space-y-3">
          <FormField label="Label"><TextInput controlSize="sm" value={transition.name ?? ""} onChange={(event) => onChange({ ...transition, name: event.target.value })} /></FormField>
          <TransitionScratchEditor
            transition={transition}
            stateOptions={Object.values(definition.states).map((state) => ({ id: state.id, name: state.name }))}
            tagPaths={tagPaths}
            onChange={onChange}
          />
        </div>
      </PanelCard>
    </div>
  );
}

function JsApiCard({ definition }: { definition: StateMachineDefinition }) {
  const snippet = `const machine = stateMachines.define({\n  id: ${JSON.stringify(definition.id)},\n  projectId: ${JSON.stringify(definition.projectId)},\n  name: ${JSON.stringify(definition.name)},\n  initial: ${JSON.stringify(definition.initialStateId)},\n  states: [\n    stateMachines.state("idle", { name: "IDLE", x: 80, y: 120 }),\n    stateMachines.state("running", { name: "RUNNING", x: 420, y: 120 }),\n  ],\n  transitions: [\n    stateMachines.transition("start", "idle", "running", {\n      trigger: stateMachines.trigger.event("START"),\n      guard: stateMachines.guard.tag("Safety.Ok").eq(true),\n      actions: [stateMachines.action.setTag("Motor.Command", true)],\n    }),\n  ],\n});`;
  return (
    <PanelCard className="p-4">
      <div className="flex items-start justify-between gap-2">
        <SectionHeader title="JavaScript API" description="The visual graph and JS API create the same serializable definition." />
        <Button size="icon-xs" variant="ghost" aria-label="Copy JS API example" onClick={() => void navigator.clipboard?.writeText(snippet)}><Copy size={13} /></Button>
      </div>
      <pre className="mt-4 max-h-[330px] overflow-auto rounded-xl bg-zinc-950 p-3 text-[10px] leading-4 text-zinc-200"><code>{snippet}</code></pre>
    </PanelCard>
  );
}
