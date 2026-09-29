import { Pause } from "lucide-react";
import { useEffect, useMemo, useReducer, useState } from "react";
import { useParams } from "react-router-dom";
import { getProjectById, subscribeProject } from "../../project/api/projects-api";
import type { ProjectData } from "../../tags/model/TagDefinition";
import {
  ActivityIcon,
  Box,
  Button,
  DeleteIcon,
  FormField,
  PageContainer,
  PageHeader,
  PanelCard,
  PlayIcon,
  ResetIcon,
  SaveIcon,
  SectionHeader,
  Select,
  TextInput,
  WorkflowIcon,
  WorkspaceShell,
} from "../../shared/ui";
import { WorkspaceHeader } from "../../shared/ui/organisms/WorkspaceHeader";
import {
  AnimatorSimulationSession,
  ProcessCanvas,
  buildPathMetrics,
  conveyorDemoPath,
  conveyorDemoScene,
  createProcessDefinition,
  getProcessStateAppearance,
  resolveProcessFrame,
  useProcessLibrary,
  useProcesses,
  listProcessBindingPaths,
  resolveProcessBindingValues,
  type AnimationPath,
  type ProcessDefinition,
  type ProcessScene,
  type ProcessTagBindings,
} from "../../processes";
import { ProcessBindingsEditor } from "../editor/ProcessBindingsEditor";
import { ProcessSceneEditor } from "../editor/ProcessSceneEditor";
import { WaypointEditor } from "../editor/WaypointEditor";
import { usePlaybackClock } from "../runtime/use-playback-clock";

const LOCAL_PROJECT_ID = "__local_animation_lab__";

export function AnimationLabPage() {
  const { projectId } = useParams();
  const persistenceProjectId = projectId ?? LOCAL_PROJECT_ID;
  const library = useProcessLibrary();
  const savedProcesses = useProcesses(persistenceProjectId);

  const [processId, setProcessId] = useState(() => createId("process"));
  const [processName, setProcessName] = useState("Conveyor process");
  const [createdAt, setCreatedAt] = useState<number | undefined>();
  const [durationSeconds, setDurationSeconds] = useState(6);
  const [loopMode, setLoopMode] = useState<"loop" | "once">("loop");
  const [path, setPath] = useState<AnimationPath>(() => cloneAnimationPath(conveyorDemoPath));
  const [scene, setScene] = useState<ProcessScene>(() => cloneProcessScene(conveyorDemoScene));
  const [bindings, setBindings] = useState<ProcessTagBindings>({});
  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>(
    conveyorDemoPath.points[0]?.id ?? null,
  );
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [simulationSession, setSimulationSession] = useState<AnimatorSimulationSession | null>(null);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [, forceTagRender] = useReducer((version: number) => version + 1, 0);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!projectId) {
      setProjectData(null);
      return;
    }

    void getProjectById(projectId)
      .then((project) => {
        if (!cancelled) setProjectData(project.tree.data ?? { udts: {}, tags: {} });
      })
      .catch(() => {
        if (!cancelled) setProjectData({ udts: {}, tags: {} });
      });

    const unsubscribe = subscribeProject(projectId, (project) => {
      if (!cancelled) setProjectData(project.tree.data ?? { udts: {}, tags: {} });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !projectData) {
      setSimulationSession(null);
      setSimulationRunning(false);
      return;
    }

    const session = new AnimatorSimulationSession(projectId, projectData);
    setSimulationSession(session);
    setSimulationRunning(false);
    return () => session.dispose();
  }, [projectId, projectData]);

  const subscribedTags = useMemo(
    () => listProcessBindingPaths(bindings),
    [bindings],
  );
  const subscribedTagKey = subscribedTags.join("\u0000");

  useEffect(() => {
    if (!simulationSession || subscribedTags.length === 0) return undefined;
    const unsubscribes = [...new Set(subscribedTags)].map((tagPath) =>
      simulationSession.subscribe(tagPath, forceTagRender),
    );
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [simulationSession, subscribedTagKey]);

  const metrics = useMemo(() => buildPathMetrics(path), [path]);
  const playback = usePlaybackClock(durationSeconds * 1000, loopMode === "loop");

  const bindingValues = resolveProcessBindingValues(bindings, simulationSession);
  const progress = bindingValues.progress ?? playback.progress;
  const tagObjectState = bindingValues.objectState;
  const sensorStates = bindingValues.sensorStates;
  const frame = resolveProcessFrame(path, scene, progress, {
    ...(tagObjectState ? { objectState: tagObjectState } : {}),
    sensorStates,
  });
  const stateAppearance = getProcessStateAppearance(frame.objectState);

  async function saveProcess() {
    try {
      const definition = createProcessDefinition({
        id: processId,
        projectId: persistenceProjectId,
        name: processName.trim() || "Untitled process",
        path: { ...cloneAnimationPath(path), name: processName.trim() || path.name },
        scene: cloneProcessScene(scene),
        playback: { durationSeconds, loopMode },
        bindings,
        ...(createdAt ? { createdAt } : {}),
      });
      await library.save(definition);
      setCreatedAt(definition.createdAt);
      setSaveStatus("Saved to IndexedDB");
      window.setTimeout(() => setSaveStatus(null), 1800);
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : String(error));
    }
  }

  async function loadProcess(id: string) {
    try {
      const definition = await library.get(id);
      if (!definition) return;
      applyDefinition(definition);
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : String(error));
    }
  }

  async function deleteProcess() {
    try {
      const definition = await library.get(processId);
      if (!definition) return;
      await library.delete(definition);
      createNewProcess();
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : String(error));
    }
  }

  function applyDefinition(definition: ProcessDefinition) {
    setProcessId(definition.id);
    setProcessName(definition.name);
    setCreatedAt(definition.createdAt);
    setPath(cloneAnimationPath(definition.path));
    setScene(cloneProcessScene(definition.scene));
    setDurationSeconds(definition.playback.durationSeconds);
    setLoopMode(definition.playback.loopMode);
    setBindings(structuredClone(definition.bindings));
    setSelectedWaypointId(definition.path.points[0]?.id ?? null);
    playback.reset();
  }

  function createNewProcess() {
    setProcessId(createId("process"));
    setProcessName("New process");
    setCreatedAt(undefined);
    setPath(cloneAnimationPath(conveyorDemoPath));
    setScene(cloneProcessScene(conveyorDemoScene));
    setDurationSeconds(6);
    setLoopMode("loop");
    setBindings({});
    setSelectedWaypointId(conveyorDemoPath.points[0]?.id ?? null);
    playback.reset();
  }

  function toggleSimulation() {
    if (!simulationSession) return;
    if (simulationRunning) {
      simulationSession.stop();
      setSimulationRunning(false);
    } else {
      simulationSession.start();
      setSimulationRunning(true);
    }
  }

  return (
    <WorkspaceShell
      header={
        <WorkspaceHeader
          active="animations"
          projectId={projectId}
          title="Animations"
          subtitle="Process visualization editor"
        />
      }
    >
      <PageContainer size="full" className="max-w-[1550px] space-y-5 px-6 py-6">
        <PageHeader
          eyebrow="Process animator"
          icon={<ActivityIcon size={14} />}
          title="Process visualization"
          description="Processes are persisted in IndexedDB, can bind to project tags, and become drag-and-drop components in the Designer. Animator simulation is an isolated runtime session."
        />

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_410px]">
          <PanelCard className="overflow-hidden rounded-xl p-0 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--editor-border)] px-4 py-3">
              <div>
                <div className="text-xs font-semibold text-[var(--editor-text)]">{processName}</div>
                <div className="mt-0.5 text-[10px] text-[var(--editor-text-muted)]">
                  {path.points.length} waypoints · {Math.round(metrics.totalLength)} px · {scene.zones.length} zones · {scene.sensors.length} sensors
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-[var(--editor-text-muted)]">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--editor-border)] bg-white px-2 py-1">
                  <span className="size-2 rounded-full" style={{ backgroundColor: stateAppearance.color }} />
                  {stateAppearance.label}
                </span>
                {bindings.progress ? (
                  <span className="rounded-full bg-indigo-50 px-2 py-1 font-semibold text-indigo-700">TAG DRIVEN</span>
                ) : null}
              </div>
            </div>

            <div className="bg-[#f7f8fc] p-4 sm:p-6">
              <ProcessCanvas
                path={path}
                scene={scene}
                frame={frame}
                selectedWaypointId={selectedWaypointId}
                onSelectWaypoint={setSelectedWaypointId}
                onPathChange={setPath}
              />
            </div>

            <div className="border-t border-[var(--editor-border)] bg-white px-4 py-4">
              <input
                aria-label="Animation progress"
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={progress}
                disabled={Boolean(bindings.progress)}
                onChange={(event) => playback.seek(Number(event.target.value))}
                className="w-full accent-[var(--editor-accent)] disabled:opacity-50"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {!bindings.progress ? (
                    playback.state === "playing" ? (
                      <Button variant="primary" size="sm" onClick={playback.pause}><Pause size={13} /> Pause</Button>
                    ) : (
                      <Button variant="primary" size="sm" onClick={playback.play}><PlayIcon size={13} /> Play</Button>
                    )
                  ) : null}
                  <Button size="sm" onClick={playback.reset}><ResetIcon size={13} /> Reset</Button>
                  {simulationSession ? (
                    <Button size="sm" variant={simulationRunning ? "danger" : "secondary"} onClick={toggleSimulation}>
                      {simulationRunning ? "Stop animator simulator" : "Start animator simulator"}
                    </Button>
                  ) : null}
                </div>
                <div className="font-mono text-[10px] text-[var(--editor-text-muted)]">{(progress * 100).toFixed(1)}%</div>
              </div>
            </div>
          </PanelCard>

          <div className="space-y-5">
            <PanelCard className="rounded-xl p-4 shadow-sm">
              <SectionHeader title="Process" description="Saved process = reusable Designer component." />
              <div className="mt-4 space-y-3">
                <FormField label="Name"><TextInput value={processName} onChange={(event) => setProcessName(event.target.value)} /></FormField>
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" size="sm" onClick={() => void saveProcess()}><SaveIcon size={13} /> Save process</Button>
                  <Button size="sm" onClick={createNewProcess}>New</Button>
                  {createdAt ? <Button variant="danger" size="sm" onClick={() => void deleteProcess()}><DeleteIcon size={13} /> Delete</Button> : null}
                </div>
                {saveStatus ? <div className="text-[10px] font-semibold text-emerald-600">{saveStatus}</div> : null}

                <FormField label="Saved processes">
                  <Select value={processId} onChange={(event) => void loadProcess(event.target.value)}>
                    {!savedProcesses.items.some((item) => item.id === processId) ? <option value={processId}>Current unsaved process</option> : null}
                    {savedProcesses.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </Select>
                </FormField>
              </div>
            </PanelCard>

            <PanelCard className="rounded-xl p-4 shadow-sm">
              <SectionHeader title="Playback" description={bindings.progress ? "Progress is driven by the selected tag." : "Local animator clock."} />
              <div className="mt-4 space-y-3">
                <FormField label="Duration"><TextInput type="number" min={0.5} max={60} step={0.5} value={durationSeconds} onChange={(event) => setDurationSeconds(clamp(Number(event.target.value) || 0.5, 0.5, 60))} /></FormField>
                <FormField label="Playback mode">
                  <Select value={loopMode} onChange={(event) => setLoopMode(event.target.value === "once" ? "once" : "loop")}>
                    <option value="loop">Loop</option><option value="once">Play once</option>
                  </Select>
                </FormField>
              </div>
            </PanelCard>

            <ProcessBindingsEditor data={projectData} scene={scene} bindings={bindings} onChange={setBindings} />

            <PanelCard className="rounded-xl p-4 shadow-sm">
              <SectionHeader title="Runtime sample" description="Resolved through the same process API used by the component runtime." />
              <dl className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                <Metric label="x" value={frame.position.x.toFixed(1)} />
                <Metric label="y" value={frame.position.y.toFixed(1)} />
                <Metric label="segment" value={`${frame.position.segmentIndex + 1}/${metrics.segments.length}`} />
                <Metric label="angle" value={`${frame.position.angleDegrees.toFixed(0)}°`} />
                <Metric label="state" value={stateAppearance.label} />
                <Metric label="zone" value={frame.activeZones.map((zone) => zone.name).join(", ") || "—"} />
                <Metric label="sensor" value={frame.activeSensors.map((sensor) => sensor.name).join(", ") || "—"} />
                <Metric label="simulator" value={simulationSession ? (simulationRunning ? "isolated · running" : "isolated · stopped") : "not available"} />
              </dl>
            </PanelCard>

            <WaypointEditor path={path} selectedWaypointId={selectedWaypointId} onSelectedWaypointIdChange={setSelectedWaypointId} onChange={setPath} />
            <ProcessSceneEditor scene={scene} onChange={setScene} />

            <Box className="flex gap-2 rounded-xl border border-dashed border-[var(--editor-border-strong)] bg-white/60 px-4 py-3 text-[11px] leading-5 text-[var(--editor-text-muted)]">
              <WorkflowIcon size={15} className="mt-0.5 shrink-0 text-[var(--editor-accent)]" />
              Animator simulator owns a separate ProjectRuntimeSession and TagStore. Starting it never starts, stops or mutates the runtime simulator used by the rendered project.
            </Box>
          </div>
        </div>
      </PageContainer>
    </WorkspaceShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] px-3 py-2">
      <dt className="text-[9px] font-semibold uppercase tracking-wider text-[var(--editor-text-soft)]">{label}</dt>
      <dd className="mt-1 truncate font-mono font-semibold text-[var(--editor-text)]" title={value}>{value}</dd>
    </div>
  );
}

function cloneAnimationPath(path: AnimationPath): AnimationPath {
  return {
    ...path,
    points: path.points.map((point) => point.changes ? { ...point, changes: { ...point.changes } } : { ...point }),
  };
}

function cloneProcessScene(scene: ProcessScene): ProcessScene {
  return {
    zones: scene.zones.map((zone) => ({ ...zone })),
    sensors: scene.sensors.map((sensor) => ({ ...sensor })),
  };
}

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
