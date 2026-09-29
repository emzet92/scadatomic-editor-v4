import { Pause } from "lucide-react";
import {
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useParams } from "react-router-dom";
import {
  ActivityIcon,
  Box,
  Button,
  FormField,
  TextInput,
  PageContainer,
  PageHeader,
  PanelCard,
  PlayIcon,
  ResetIcon,
  SectionHeader,
  Select,
  WorkflowIcon,
  WorkspaceShell,
} from "../../shared/ui";
import { WorkspaceHeader } from "../../shared/ui/organisms/WorkspaceHeader";
import type { AnimationPath, ProcessObjectState } from "../model/animation-path";
import { conveyorDemoPath } from "../model/animation-path";
import type { ProcessScene, ProcessSensor, ProcessZone } from "../model/process-scene";
import { conveyorDemoScene } from "../model/process-scene";
import {
  DEFAULT_PROCESS_OBJECT_STATE,
  getProcessStateAppearance,
} from "../model/process-state";
import { resolveWaypointChanges } from "../model/waypoint-changes";
import { ProcessSceneEditor } from "../editor/ProcessSceneEditor";
import { WaypointEditor } from "../editor/WaypointEditor";
import { buildPathMetrics, samplePath } from "../runtime/path-sampler";
import { usePlaybackClock } from "../runtime/use-playback-clock";

const STAGE_WIDTH = 880;
const STAGE_HEIGHT = 460;
const RECT_WIDTH = 62;
const RECT_HEIGHT = 42;
const WAYPOINT_DRAG_SNAP = 5;

export function AnimationLabPage() {
  const { projectId } = useParams();
  const [durationSeconds, setDurationSeconds] = useState(6);
  const [loopMode, setLoopMode] = useState<"loop" | "once">("loop");
  const [path, setPath] = useState<AnimationPath>(() => cloneAnimationPath(conveyorDemoPath));
  const [scene, setScene] = useState<ProcessScene>(() => cloneProcessScene(conveyorDemoScene));
  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>(
    conveyorDemoPath.points[0]?.id ?? null,
  );

  const metrics = useMemo(() => buildPathMetrics(path), [path]);
  const playback = usePlaybackClock(durationSeconds * 1000, loopMode === "loop");
  const position = useMemo(
    () => samplePath(path, playback.progress, metrics),
    [metrics, path, playback.progress],
  );
  const waypointChanges = useMemo(
    () => resolveWaypointChanges(path, position.waypointIndex),
    [path, position.waypointIndex],
  );
  const objectState = waypointChanges.objectState ?? DEFAULT_PROCESS_OBJECT_STATE;
  const stateAppearance = getProcessStateAppearance(objectState);
  const boxColor = waypointChanges.boxColor ?? stateAppearance.color;
  const activeZones = useMemo(
    () => scene.zones.filter((zone) => isPointInsideZone(position.x, position.y, zone)),
    [position.x, position.y, scene.zones],
  );
  const activeSensors = useMemo(
    () => scene.sensors.filter((sensor) => isSensorTriggered(position.x, position.y, sensor)),
    [position.x, position.y, scene.sensors],
  );

  return (
    <WorkspaceShell
      header={
        <WorkspaceHeader
          active="animations"
          projectId={projectId}
          title="Animations"
          subtitle="Process visualization prototype"
        />
      }
    >
      <PageContainer size="full" className="max-w-[1500px] space-y-5 px-6 py-6">
        <PageHeader
          eyebrow="Animation lab"
          icon={<ActivityIcon size={14} />}
          title="Process path playback"
          description="Prototype process visualization: editable path geometry, semantic product states, process zones/stations and sensors. Playback remains independent, so progress can later come from a tag or runtime."
        />

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <PanelCard className="overflow-hidden rounded-xl p-0 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--editor-border)] px-4 py-3">
              <div>
                <div className="text-xs font-semibold text-[var(--editor-text)]">{path.name}</div>
                <div className="mt-0.5 text-[10px] text-[var(--editor-text-muted)]">
                  {path.points.length} waypointów · {Math.round(metrics.totalLength)} px · {scene.zones.length} zones · {scene.sensors.length} sensors
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-[var(--editor-text-muted)]">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--editor-border)] bg-white px-2 py-1">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: stateAppearance.color }}
                  />
                  {stateAppearance.label}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <StatusDot state={playback.state} />
                  <span className="capitalize">{playback.state}</span>
                </span>
              </div>
            </div>

            <div className="bg-[#f7f8fc] p-4 sm:p-6">
              <AnimationStage
                path={path}
                scene={scene}
                progress={playback.progress}
                position={position}
                boxColor={boxColor}
                objectState={objectState}
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
                value={playback.progress}
                onChange={(event) => playback.seek(Number(event.target.value))}
                className="w-full accent-[var(--editor-accent)]"
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {playback.state === "playing" ? (
                    <Button variant="primary" size="sm" onClick={playback.pause}>
                      <Pause size={13} /> Pause
                    </Button>
                  ) : (
                    <Button variant="primary" size="sm" onClick={playback.play}>
                      <PlayIcon size={13} /> Play
                    </Button>
                  )}
                  <Button size="sm" onClick={playback.reset}>
                    <ResetIcon size={13} /> Reset
                  </Button>
                </div>

                <div className="flex items-center gap-3 font-mono text-[10px] text-[var(--editor-text-muted)]">
                  {activeSensors.length > 0 ? (
                    <span className="font-sans font-semibold text-emerald-600">
                      {activeSensors.map((sensor) => sensor.name).join(", ")} active
                    </span>
                  ) : null}
                  <span>{(playback.progress * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </PanelCard>

          <div className="space-y-5">
            <PanelCard className="rounded-xl p-4 shadow-sm">
              <SectionHeader
                title="Playback"
                description="Na razie źródłem progressu jest requestAnimationFrame."
              />

              <div className="mt-4 space-y-3">
                <FormField label="Duration" description="Czas pełnego przejazdu po ścieżce.">
                  <TextInput
                    type="number"
                    min={0.5}
                    max={60}
                    step={0.5}
                    value={durationSeconds}
                    onChange={(event) =>
                      setDurationSeconds(clamp(Number(event.target.value) || 0.5, 0.5, 60))
                    }
                  />
                </FormField>

                <FormField label="Playback mode">
                  <Select
                    value={loopMode}
                    onChange={(event) => setLoopMode(event.target.value === "once" ? "once" : "loop")}
                  >
                    <option value="loop">Loop</option>
                    <option value="once">Play once</option>
                  </Select>
                </FormField>
              </div>
            </PanelCard>

            <PanelCard className="rounded-xl p-4 shadow-sm">
              <SectionHeader
                title="Runtime sample"
                description="Process context resolved from geometry + semantic waypoint state."
              />
              <dl className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                <Metric label="x" value={position.x.toFixed(1)} />
                <Metric label="y" value={position.y.toFixed(1)} />
                <Metric label="segment" value={`${position.segmentIndex + 1}/${metrics.segments.length}`} />
                <Metric label="angle" value={`${position.angleDegrees.toFixed(0)}°`} />
                <Metric label="waypoint" value={`${position.waypointIndex + 1}/${path.points.length}`} />
                <Metric label="state" value={stateAppearance.label} />
                <Metric label="zone" value={activeZones.map((zone) => zone.name).join(", ") || "—"} />
                <Metric label="sensor" value={activeSensors.map((sensor) => sensor.name).join(", ") || "—"} />
              </dl>
            </PanelCard>

            <WaypointEditor
              path={path}
              selectedWaypointId={selectedWaypointId}
              onSelectedWaypointIdChange={setSelectedWaypointId}
              onChange={setPath}
            />

            <ProcessSceneEditor scene={scene} onChange={setScene} />

            <Box className="flex gap-2 rounded-xl border border-dashed border-[var(--editor-border-strong)] bg-white/60 px-4 py-3 text-[11px] leading-5 text-[var(--editor-text-muted)]">
              <WorkflowIcon size={15} className="mt-0.5 shrink-0 text-[var(--editor-accent)]" />
              Waypointy możesz przeciągać bezpośrednio po canvasie. Zones/stations pokazują kontekst procesu, a sensory świecą po wejściu obiektu w ich promień. Następny naturalny krok to binding sensorów i progressu do realnych tagów.
            </Box>
          </div>
        </div>
      </PageContainer>
    </WorkspaceShell>
  );
}

function AnimationStage({
  path,
  scene,
  progress,
  position,
  boxColor,
  objectState,
  selectedWaypointId,
  onSelectWaypoint,
  onPathChange,
}: {
  path: AnimationPath;
  scene: ProcessScene;
  progress: number;
  position: ReturnType<typeof samplePath>;
  boxColor: string;
  objectState: ProcessObjectState;
  selectedWaypointId: string | null;
  onSelectWaypoint: (waypointId: string) => void;
  onPathChange: (path: AnimationPath) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingWaypointId, setDraggingWaypointId] = useState<string | null>(null);
  const points = path.points.map((point) => `${point.x},${point.y}`).join(" ");
  const stateAppearance = getProcessStateAppearance(objectState);

  function beginWaypointDrag(
    waypointId: string,
    event: ReactPointerEvent<SVGGElement>,
  ) {
    event.preventDefault();
    event.stopPropagation();
    onSelectWaypoint(waypointId);
    setDraggingWaypointId(waypointId);
    svgRef.current?.setPointerCapture(event.pointerId);
  }

  function moveWaypoint(event: ReactPointerEvent<SVGSVGElement>) {
    if (!draggingWaypointId) return;
    const svg = svgRef.current;
    if (!svg) return;

    const point = clientPointToSvg(svg, event.clientX, event.clientY);
    const x = snap(clamp(point.x, 12, STAGE_WIDTH - 12), WAYPOINT_DRAG_SNAP);
    const y = snap(clamp(point.y, 12, STAGE_HEIGHT - 12), WAYPOINT_DRAG_SNAP);

    onPathChange({
      ...path,
      points: path.points.map((waypoint) =>
        waypoint.id === draggingWaypointId ? { ...waypoint, x, y } : waypoint,
      ),
    });
  }

  function endWaypointDrag(event: ReactPointerEvent<SVGSVGElement>) {
    if (!draggingWaypointId) return;
    if (svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId);
    }
    setDraggingWaypointId(null);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--editor-border)] bg-white shadow-inner">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`}
        role="img"
        aria-label="Editable process path with zones, sensors and a moving process object"
        className="block h-auto w-full select-none"
        style={{ touchAction: "none" }}
        onPointerMove={moveWaypoint}
        onPointerUp={endWaypointDrag}
        onPointerCancel={endWaypointDrag}
      >
        <defs>
          <pattern id="animation-lab-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#d8dbea" />
          </pattern>
          <filter id="animation-lab-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor="#312e81" floodOpacity="0.18" />
          </filter>
          <filter id="animation-lab-sensor-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={STAGE_WIDTH} height={STAGE_HEIGHT} fill="#fafaff" />
        <rect width={STAGE_WIDTH} height={STAGE_HEIGHT} fill="url(#animation-lab-grid)" />

        {scene.zones.map((zone) => {
          const active = isPointInsideZone(position.x, position.y, zone);
          const station = zone.kind === "station";
          return (
            <g key={zone.id} data-process-zone={zone.id}>
              <rect
                x={zone.x}
                y={zone.y}
                width={zone.width}
                height={zone.height}
                rx={station ? 14 : 10}
                fill={active ? (station ? "#eef2ff" : "#ecfdf5") : station ? "#f5f3ff" : "#f8fafc"}
                stroke={active ? (station ? "#6366f1" : "#10b981") : station ? "#c4b5fd" : "#cbd5e1"}
                strokeWidth={active ? 2.5 : 1.5}
                strokeDasharray={station ? undefined : "7 6"}
              />
              <text
                x={zone.x + 10}
                y={zone.y + 18}
                fontSize="10"
                fontWeight="700"
                fill={active ? "#334155" : "#64748b"}
              >
                {zone.name}
              </text>
              <text
                x={zone.x + 10}
                y={zone.y + 32}
                fontSize="8"
                fontWeight="600"
                fill="#94a3b8"
              >
                {zone.kind.toUpperCase()}{active ? " · ACTIVE" : ""}
              </text>
            </g>
          );
        })}

        <polyline
          points={points}
          fill="none"
          stroke="#c7d2fe"
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#6366f1"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="8 9"
        />

        {scene.sensors.map((sensor) => {
          const active = isSensorTriggered(position.x, position.y, sensor);
          return (
            <g key={sensor.id} data-process-sensor={sensor.id}>
              <circle
                cx={sensor.x}
                cy={sensor.y}
                r={sensor.triggerRadius}
                fill={active ? "#10b981" : "#94a3b8"}
                fillOpacity={active ? 0.08 : 0.035}
                stroke={active ? "#10b981" : "#cbd5e1"}
                strokeWidth="1"
                strokeDasharray="4 5"
              />
              <circle
                cx={sensor.x}
                cy={sensor.y}
                r="8"
                fill={active ? "#10b981" : "#ffffff"}
                stroke={active ? "#059669" : "#64748b"}
                strokeWidth="2"
                filter={active ? "url(#animation-lab-sensor-glow)" : undefined}
              />
              <circle
                cx={sensor.x}
                cy={sensor.y}
                r="2.5"
                fill={active ? "#ffffff" : "#64748b"}
              />
              <text
                x={sensor.x}
                y={sensor.y - sensor.triggerRadius - 7}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill={active ? "#047857" : "#64748b"}
              >
                {sensor.name}{active ? " · ON" : ""}
              </text>
            </g>
          );
        })}

        {path.points.map((point, index) => {
          const resolved = resolveWaypointChanges(path, index);
          const waypointState = resolved.objectState ?? DEFAULT_PROCESS_OBJECT_STATE;
          const waypointAppearance = getProcessStateAppearance(waypointState);
          const waypointColor = resolved.boxColor ?? waypointAppearance.color;
          const selected = point.id === selectedWaypointId;
          const dragging = point.id === draggingWaypointId;

          return (
            <g
              key={point.id}
              onPointerDown={(event) => beginWaypointDrag(point.id, event)}
              className="cursor-grab active:cursor-grabbing"
              data-waypoint-id={point.id}
            >
              {selected ? (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={dragging ? 15 : 12}
                  fill={dragging ? "#eef2ff" : "none"}
                  stroke="#818cf8"
                  strokeWidth="2"
                  strokeOpacity={dragging ? 0.8 : 0.45}
                />
              ) : null}
              <circle
                cx={point.x}
                cy={point.y}
                r="7"
                fill={waypointColor}
                stroke="#ffffff"
                strokeWidth="2.5"
              />
              <circle
                cx={point.x}
                cy={point.y}
                r="7"
                fill="none"
                stroke="#4f46e5"
                strokeWidth="1"
              />
              <text
                x={point.x}
                y={point.y - 15}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="#71717a"
                pointerEvents="none"
              >
                {index + 1}
              </text>
            </g>
          );
        })}

        <g
          transform={`translate(${position.x} ${position.y}) rotate(${position.angleDegrees})`}
          filter="url(#animation-lab-shadow)"
          data-progress={progress.toFixed(4)}
          data-waypoint-index={position.waypointIndex}
          data-process-state={objectState}
          pointerEvents="none"
        >
          <rect
            x={-RECT_WIDTH / 2}
            y={-RECT_HEIGHT / 2}
            width={RECT_WIDTH}
            height={RECT_HEIGHT}
            rx="8"
            fill={boxColor}
          />
          <rect
            x={-RECT_WIDTH / 2 + 5}
            y={-RECT_HEIGHT / 2 + 5}
            width={RECT_WIDTH - 10}
            height={RECT_HEIGHT - 10}
            rx="5"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.55"
            strokeWidth="1.5"
          />
          <text
            x="0"
            y="4"
            textAnchor="middle"
            fontSize="8"
            fontWeight="800"
            fill="#ffffff"
            letterSpacing="0.7"
          >
            {shortStateLabel(stateAppearance.label)}
          </text>
        </g>
      </svg>
    </div>
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

function StatusDot({ state }: { state: string }) {
  return (
    <span
      className={`size-2 rounded-full ${
        state === "playing" ? "bg-emerald-500" : state === "finished" ? "bg-indigo-500" : "bg-zinc-300"
      }`}
    />
  );
}

function isPointInsideZone(x: number, y: number, zone: ProcessZone): boolean {
  return x >= zone.x && x <= zone.x + zone.width && y >= zone.y && y <= zone.y + zone.height;
}

function isSensorTriggered(x: number, y: number, sensor: ProcessSensor): boolean {
  return Math.hypot(x - sensor.x, y - sensor.y) <= sensor.triggerRadius;
}

function clientPointToSvg(svg: SVGSVGElement, clientX: number, clientY: number) {
  const matrix = svg.getScreenCTM();
  if (matrix) {
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    return point.matrixTransform(matrix.inverse());
  }

  const rect = svg.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / Math.max(rect.width, 1)) * STAGE_WIDTH,
    y: ((clientY - rect.top) / Math.max(rect.height, 1)) * STAGE_HEIGHT,
  };
}

function shortStateLabel(label: string): string {
  return label.length > 8 ? label.slice(0, 8).toUpperCase() : label.toUpperCase();
}

function cloneAnimationPath(path: AnimationPath): AnimationPath {
  return {
    ...path,
    points: path.points.map((point) =>
      point.changes ? { ...point, changes: { ...point.changes } } : { ...point },
    ),
  };
}

function cloneProcessScene(scene: ProcessScene): ProcessScene {
  return {
    zones: scene.zones.map((zone) => ({ ...zone })),
    sensors: scene.sensors.map((sensor) => ({ ...sensor })),
  };
}

function snap(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
