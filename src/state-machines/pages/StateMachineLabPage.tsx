import { Code2, Plus, Save, Trash2, Workflow } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getProjectById, subscribeProject } from "../../project/api/projects-api";
import type { ProjectData } from "../../tags/model/TagDefinition";
import { Button, Select, TextInput, WorkspaceShell } from "../../shared/ui";
import { WorkspaceHeader } from "../../shared/ui/organisms/WorkspaceHeader";
import type { StateMachineDefinition, StateDefinition, TransitionDefinition } from "../domain/state-machine-definition";
import { createPackMlStarterTemplate, createSimpleMachineTemplate } from "../application/templates";
import { validateStateMachineDefinition } from "../domain/state-machine-definition";
import { useStateMachineLibrary } from "../react/StateMachineLibraryProvider";
import { useStateMachines } from "../react/useStateMachines";
import { StateMachineCanvas, type MachineSelection } from "../components/StateMachineCanvas";
import { StateMachineInspector } from "../components/StateMachineInspector";
import { StateMachineSimulator } from "../components/StateMachineSimulator";

const LOCAL_PROJECT = "__local_state_machine_lab__";

export function StateMachineLabPage() {
  const { projectId } = useParams();
  const ownerProjectId = projectId ?? LOCAL_PROJECT;
  const library = useStateMachineLibrary();
  const saved = useStateMachines(ownerProjectId);
  const [definition, setDefinition] = useState<StateMachineDefinition>(() => createSimpleMachineTemplate(ownerProjectId, createId("machine")));
  const [selection, setSelection] = useState<MachineSelection>(null);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) { setProjectData(null); return; }
    let cancelled = false;
    void getProjectById(projectId).then((project) => { if (!cancelled) setProjectData(project.tree.data ?? { udts: {}, tags: {} }); });
    const unsubscribe = subscribeProject(projectId, (project) => { if (!cancelled) setProjectData(project.tree.data ?? { udts: {}, tags: {} }); });
    return () => { cancelled = true; unsubscribe(); };
  }, [projectId]);

  const tagPaths = useMemo(() => Object.values(projectData?.tags ?? {}).map((tag) => tag.name).sort(), [projectData]);

  async function save() {
    const errors = validateStateMachineDefinition(definition);
    if (errors.length) { setStatus(errors[0] ?? "Invalid state machine"); return; }
    const savedDefinition = await library.save(definition);
    setDefinition(savedDefinition);
    setStatus("Saved");
    window.setTimeout(() => setStatus(null), 1500);
  }

  async function load(id: string) {
    const value = await library.get(id);
    if (!value) return;
    setDefinition(value);
    setSelection(null);
  }

  async function remove() {
    await library.delete(definition);
    newSimple();
  }

  function newSimple() {
    setDefinition(createSimpleMachineTemplate(ownerProjectId, createId("machine")));
    setSelection(null);
  }

  function newPackMl() {
    setDefinition(createPackMlStarterTemplate(ownerProjectId, createId("machine")));
    setSelection(null);
  }

  function addState() {
    const index = Object.keys(definition.states).length + 1;
    const id = uniqueStateId(definition, `state_${index}`);
    const state: StateDefinition = {
      id,
      name: `STATE ${index}`,
      position: { x: 120 + (index % 4) * 230, y: 100 + Math.floor(index / 4) * 210 },
      onEnter: [],
      onExit: [],
    };
    setDefinition({ ...definition, states: { ...definition.states, [id]: state } });
    setSelection({ kind: "state", id });
  }

  function createTransition(from: string, to: string) {
    const transition: TransitionDefinition = {
      id: createId("transition"),
      from,
      to,
      trigger: { kind: "event", event: "EVENT" },
      actions: [],
      priority: 0,
    };
    setDefinition({ ...definition, transitions: [...definition.transitions, transition] });
    setSelection({ kind: "transition", id: transition.id });
  }

  function deleteState(stateId: string) {
    const remaining = Object.fromEntries(Object.entries(definition.states).filter(([id]) => id !== stateId));
    if (Object.keys(remaining).length === 0) return;
    const initialStateId = definition.initialStateId === stateId ? Object.keys(remaining)[0]! : definition.initialStateId;
    setDefinition({
      ...definition,
      states: remaining,
      initialStateId,
      transitions: definition.transitions.filter((transition) => transition.from !== stateId && transition.to !== stateId),
    });
    setSelection(null);
  }

  function deleteTransition(transitionId: string) {
    setDefinition({ ...definition, transitions: definition.transitions.filter((transition) => transition.id !== transitionId) });
    setSelection(null);
  }

  return (
    <WorkspaceShell
      header={
        <WorkspaceHeader
          active="stateMachines"
          projectId={projectId}
          title="State Machines"
          subtitle="Visual deterministic logic"
          actions={
            <div className="flex items-center gap-2">
              <Select className="min-w-52" controlSize="sm" value={saved.some((item) => item.id === definition.id) ? definition.id : ""} onChange={(event) => void load(event.target.value)}>
                <option value="">Unsaved machine</option>
                {saved.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
              <Button size="sm" variant="primary" onClick={() => void save()}><Save size={13} /> Save</Button>
            </div>
          }
        />
      }
      sidebar={
        <div className="w-64 space-y-4 p-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.14em] text-zinc-400">Machine</div>
            <TextInput className="mt-2" controlSize="sm" value={definition.name} onChange={(event) => setDefinition({ ...definition, name: event.target.value })} />
          </div>
          <div className="grid gap-2">
            <Button size="sm" variant="secondary" onClick={addState}><Plus size={13} /> Add state</Button>
            <Button size="sm" variant="ghost" onClick={newSimple}><Workflow size={13} /> Simple template</Button>
            <Button size="sm" variant="ghost" onClick={newPackMl}><Code2 size={13} /> PackML starter</Button>
            {saved.some((item) => item.id === definition.id) ? <Button size="sm" variant="danger" onClick={() => void remove()}><Trash2 size={13} /> Delete machine</Button> : null}
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-[10px] leading-4 text-zinc-500">
            <strong className="block text-zinc-700">Connect states</strong>
            Drag from the handle on the right side of a state to another state. A transition block will be created automatically.
          </div>
          {status ? <div className="text-xs font-semibold text-emerald-600">{status}</div> : null}
        </div>
      }
      inspector={
        <div className="h-full w-[390px] overflow-auto bg-zinc-50 p-4">
          <StateMachineInspector
            definition={definition}
            selection={selection}
            tagPaths={tagPaths}
            onDefinitionChange={setDefinition}
            onDeleteState={deleteState}
            onDeleteTransition={deleteTransition}
          />
        </div>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="min-h-0 flex-1">
          <StateMachineCanvas
            definition={definition}
            selection={selection}
            onSelectionChange={setSelection}
            onMoveState={(stateId, position) => {
              const state = definition.states[stateId];
              if (!state) return;
              setDefinition({ ...definition, states: { ...definition.states, [stateId]: { ...state, position } } });
            }}
            onCreateTransition={createTransition}
          />
        </div>
        <div className="shrink-0 border-t border-[var(--editor-border)] bg-white p-3">
          <StateMachineSimulator definition={definition} />
        </div>
      </div>
    </WorkspaceShell>
  );
}

function createId(prefix: string) {
  return `${prefix}-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;
}

function uniqueStateId(definition: StateMachineDefinition, base: string) {
  let value = base;
  let index = 2;
  while (definition.states[value]) value = `${base}_${index++}`;
  return value;
}
