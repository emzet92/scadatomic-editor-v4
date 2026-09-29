import { Pause } from "lucide-react";
import { useMemo, useState } from "react";
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
import { conveyorDemoPath } from "../model/animation-path";
import { buildPathMetrics, samplePath } from "../runtime/path-sampler";
import { usePlaybackClock } from "../runtime/use-playback-clock";

const STAGE_WIDTH = 880;
const STAGE_HEIGHT = 460;
const RECT_WIDTH = 62;
const RECT_HEIGHT = 42;

export function AnimationLabPage() {
  const { projectId } = useParams();
  const [durationSeconds, setDurationSeconds] = useState(6);
  const [loopMode, setLoopMode] = useState<"loop" | "once">("loop");

  const path = conveyorDemoPath;
  const metrics = useMemo(() => buildPathMetrics(path), [path]);
  const playback = usePlaybackClock(durationSeconds * 1000, loopMode === "loop");
  const position = useMemo(
    () => samplePath(path, playback.progress, metrics),
    [metrics, path, playback.progress],
  );

  return (
    <WorkspaceShell
      header={
        <WorkspaceHeader
          active="animations"
          projectId={projectId}
          title="Animations"
          subtitle="Path animation prototype"
        />
      }
    >
      <PageContainer size="full" className="max-w-[1500px] space-y-5 px-6 py-6">
        <PageHeader
          eyebrow="Animation lab"
          icon={<ActivityIcon size={14} />}
          title="Path playback"
          description="Prototype przyszłego modułu animacji: prostokąt porusza się ze stałą prędkością po deklaratywnej ścieżce. Geometria ścieżki i zegar odtwarzania są od siebie niezależne, więc później progress może pochodzić z taga lub runtime."
        />

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <PanelCard className="overflow-hidden rounded-xl p-0 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--editor-border)] px-4 py-3">
              <div>
                <div className="text-xs font-semibold text-[var(--editor-text)]">{path.name}</div>
                <div className="mt-0.5 text-[10px] text-[var(--editor-text-muted)]">
                  {path.points.length} waypointów · {Math.round(metrics.totalLength)} px długości
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-[var(--editor-text-muted)]">
                <StatusDot state={playback.state} />
                <span className="capitalize">{playback.state}</span>
              </div>
            </div>

            <div className="bg-[#f7f8fc] p-4 sm:p-6">
              <AnimationStage progress={playback.progress} position={position} />
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

                <div className="font-mono text-[10px] text-[var(--editor-text-muted)]">
                  {(playback.progress * 100).toFixed(1)}%
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
                description="Wartości, które później mogą trafiać do transformacji komponentu."
              />
              <dl className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                <Metric label="x" value={position.x.toFixed(1)} />
                <Metric label="y" value={position.y.toFixed(1)} />
                <Metric label="segment" value={`${position.segmentIndex + 1}/${metrics.segments.length}`} />
                <Metric label="angle" value={`${position.angleDegrees.toFixed(0)}°`} />
              </dl>
            </PanelCard>

            <PanelCard className="rounded-xl p-4 shadow-sm">
              <SectionHeader
                title="Path definition"
                description="Ścieżka jest zwykłym modelem danych, nie CSS-em ani SVG path API."
              />
              <ol className="mt-4 space-y-2">
                {path.points.map((point, index) => (
                  <li
                    key={`${point.x}-${point.y}-${index}`}
                    className="flex items-center justify-between rounded-lg border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] px-3 py-2 text-[11px]"
                  >
                    <span className="flex items-center gap-2 font-medium text-[var(--editor-text)]">
                      <span className="flex size-5 items-center justify-center rounded-full bg-[var(--editor-accent-soft)] text-[9px] font-semibold text-[var(--editor-accent)]">
                        {index + 1}
                      </span>
                      waypoint
                    </span>
                    <code className="text-[10px] text-[var(--editor-text-muted)]">
                      {point.x}, {point.y}
                    </code>
                  </li>
                ))}
              </ol>
            </PanelCard>

            <Box className="flex gap-2 rounded-xl border border-dashed border-[var(--editor-border-strong)] bg-white/60 px-4 py-3 text-[11px] leading-5 text-[var(--editor-text-muted)]">
              <WorkflowIcon size={15} className="mt-0.5 shrink-0 text-[var(--editor-accent)]" />
              Następny krok: źródło progressu jako binding/tag oraz edytowalne waypointy w designerze.
            </Box>
          </div>
        </div>
      </PageContainer>
    </WorkspaceShell>
  );
}

function AnimationStage({
  progress,
  position,
}: {
  progress: number;
  position: ReturnType<typeof samplePath>;
}) {
  const points = conveyorDemoPath.points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--editor-border)] bg-white shadow-inner">
      <svg
        viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`}
        role="img"
        aria-label="Rectangle moving along a polyline animation path"
        className="block h-auto w-full"
      >
        <defs>
          <pattern id="animation-lab-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#d8dbea" />
          </pattern>
          <filter id="animation-lab-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor="#312e81" floodOpacity="0.18" />
          </filter>
        </defs>

        <rect width={STAGE_WIDTH} height={STAGE_HEIGHT} fill="#fafaff" />
        <rect width={STAGE_WIDTH} height={STAGE_HEIGHT} fill="url(#animation-lab-grid)" />

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

        {conveyorDemoPath.points.map((point, index) => (
          <g key={`${point.x}-${point.y}-${index}`}>
            <circle cx={point.x} cy={point.y} r="7" fill="#ffffff" stroke="#6366f1" strokeWidth="2" />
            <text
              x={point.x}
              y={point.y - 15}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="#71717a"
            >
              {index + 1}
            </text>
          </g>
        ))}

        <g
          transform={`translate(${position.x} ${position.y}) rotate(${position.angleDegrees})`}
          filter="url(#animation-lab-shadow)"
          data-progress={progress.toFixed(4)}
        >
          <rect
            x={-RECT_WIDTH / 2}
            y={-RECT_HEIGHT / 2}
            width={RECT_WIDTH}
            height={RECT_HEIGHT}
            rx="8"
            fill="#4f46e5"
          />
          <rect
            x={-RECT_WIDTH / 2 + 5}
            y={-RECT_HEIGHT / 2 + 5}
            width={RECT_WIDTH - 10}
            height={RECT_HEIGHT - 10}
            rx="5"
            fill="none"
            stroke="#a5b4fc"
            strokeWidth="1.5"
          />
        </g>
      </svg>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--editor-border)] bg-[var(--editor-surface-muted)] px-3 py-2">
      <dt className="text-[9px] font-semibold uppercase tracking-wider text-[var(--editor-text-soft)]">{label}</dt>
      <dd className="mt-1 font-mono font-semibold text-[var(--editor-text)]">{value}</dd>
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
