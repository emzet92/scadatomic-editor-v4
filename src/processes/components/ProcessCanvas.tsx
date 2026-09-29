import {
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { AnimationPath } from "../domain/process-path";
import type { ProcessScene } from "../domain/process-scene";
import { DEFAULT_PROCESS_OBJECT_STATE, getProcessStateAppearance } from "../domain/process-state";
import { resolveWaypointChanges } from "../domain/waypoint-changes";
import type { ProcessFrame } from "../runtime/process-frame";
import { isPointInsideZone } from "../runtime/process-frame";

export const PROCESS_STAGE_WIDTH = 880;
export const PROCESS_STAGE_HEIGHT = 460;
const RECT_WIDTH = 62;
const RECT_HEIGHT = 42;
const WAYPOINT_DRAG_SNAP = 5;

export type ProcessCanvasProps = {
  path: AnimationPath;
  scene: ProcessScene;
  frame: ProcessFrame;
  selectedWaypointId?: string | null | undefined;
  onSelectWaypoint?: ((waypointId: string) => void) | undefined;
  onPathChange?: ((path: AnimationPath) => void) | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  showGrid?: boolean | undefined;
};

/** Shared process renderer used by the animator, designer component and runtime. */
export function ProcessCanvas({
  path,
  scene,
  frame,
  selectedWaypointId,
  onSelectWaypoint,
  onPathChange,
  className,
  style,
  showGrid = true,
}: ProcessCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const svgId = useId().replace(/[^a-zA-Z0-9_-]/g, "_");
  const gridId = `${svgId}-grid`;
  const shadowId = `${svgId}-shadow`;
  const sensorGlowId = `${svgId}-sensor-glow`;
  const [draggingWaypointId, setDraggingWaypointId] = useState<string | null>(null);
  const points = path.points.map((point) => `${point.x},${point.y}`).join(" ");
  const stateAppearance = getProcessStateAppearance(frame.objectState);
  const editable = Boolean(onPathChange && onSelectWaypoint);
  const activeSensorIds = new Set(frame.activeSensors.map((sensor) => sensor.id));
  const activeZoneIds = new Set(frame.activeZones.map((zone) => zone.id));

  function beginWaypointDrag(
    waypointId: string,
    event: ReactPointerEvent<SVGGElement>,
  ) {
    if (!editable) return;
    event.preventDefault();
    event.stopPropagation();
    onSelectWaypoint?.(waypointId);
    setDraggingWaypointId(waypointId);
    svgRef.current?.setPointerCapture(event.pointerId);
  }

  function moveWaypoint(event: ReactPointerEvent<SVGSVGElement>) {
    if (!draggingWaypointId || !onPathChange) return;
    const svg = svgRef.current;
    if (!svg) return;

    const point = clientPointToSvg(svg, event.clientX, event.clientY);
    const x = snap(clamp(point.x, 12, PROCESS_STAGE_WIDTH - 12), WAYPOINT_DRAG_SNAP);
    const y = snap(clamp(point.y, 12, PROCESS_STAGE_HEIGHT - 12), WAYPOINT_DRAG_SNAP);

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
    <div
      className={`overflow-hidden rounded-xl border border-[var(--editor-border)] bg-white shadow-inner ${className ?? ""}`}
      style={style}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${PROCESS_STAGE_WIDTH} ${PROCESS_STAGE_HEIGHT}`}
        role="img"
        aria-label="Process path with zones, sensors and a moving process object"
        className="block h-auto w-full select-none"
        style={{ touchAction: editable ? "none" : "auto" }}
        onPointerMove={editable ? moveWaypoint : undefined}
        onPointerUp={editable ? endWaypointDrag : undefined}
        onPointerCancel={editable ? endWaypointDrag : undefined}
      >
        <defs>
          <pattern id={gridId} width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#d8dbea" />
          </pattern>
          <filter id={shadowId} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor="#312e81" floodOpacity="0.18" />
          </filter>
          <filter id={sensorGlowId} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={PROCESS_STAGE_WIDTH} height={PROCESS_STAGE_HEIGHT} fill="#fafaff" />
        {showGrid ? (
          <rect width={PROCESS_STAGE_WIDTH} height={PROCESS_STAGE_HEIGHT} fill={`url(#${gridId})`} />
        ) : null}

        {scene.zones.map((zone) => {
          const active = activeZoneIds.has(zone.id) || isPointInsideZone(frame.position.x, frame.position.y, zone);
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
              <text x={zone.x + 10} y={zone.y + 18} fontSize="10" fontWeight="700" fill={active ? "#334155" : "#64748b"}>
                {zone.name}
              </text>
              <text x={zone.x + 10} y={zone.y + 32} fontSize="8" fontWeight="600" fill="#94a3b8">
                {zone.kind.toUpperCase()}{active ? " · ACTIVE" : ""}
              </text>
            </g>
          );
        })}

        <polyline points={points} fill="none" stroke="#c7d2fe" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={points} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 9" />

        {scene.sensors.map((sensor) => {
          const active = activeSensorIds.has(sensor.id);
          return (
            <g key={sensor.id} data-process-sensor={sensor.id}>
              <circle cx={sensor.x} cy={sensor.y} r={sensor.triggerRadius} fill={active ? "#10b981" : "#94a3b8"} fillOpacity={active ? 0.08 : 0.035} stroke={active ? "#10b981" : "#cbd5e1"} strokeWidth="1" strokeDasharray="4 5" />
              <circle cx={sensor.x} cy={sensor.y} r="8" fill={active ? "#10b981" : "#ffffff"} stroke={active ? "#059669" : "#64748b"} strokeWidth="2" filter={active ? `url(#${sensorGlowId})` : undefined} />
              <circle cx={sensor.x} cy={sensor.y} r="2.5" fill={active ? "#ffffff" : "#64748b"} />
              <text x={sensor.x} y={sensor.y - sensor.triggerRadius - 7} textAnchor="middle" fontSize="9" fontWeight="700" fill={active ? "#047857" : "#64748b"}>
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
              onPointerDown={editable ? (event) => beginWaypointDrag(point.id, event) : undefined}
              className={editable ? "cursor-grab active:cursor-grabbing" : undefined}
              data-waypoint-id={point.id}
            >
              {selected ? (
                <circle cx={point.x} cy={point.y} r={dragging ? 15 : 12} fill={dragging ? "#eef2ff" : "none"} stroke="#818cf8" strokeWidth="2" strokeOpacity={dragging ? 0.8 : 0.45} />
              ) : null}
              <circle cx={point.x} cy={point.y} r="7" fill={waypointColor} stroke="#ffffff" strokeWidth="2.5" />
              <circle cx={point.x} cy={point.y} r="7" fill="none" stroke="#4f46e5" strokeWidth="1" />
              <text x={point.x} y={point.y - 15} textAnchor="middle" fontSize="10" fontWeight="700" fill="#71717a" pointerEvents="none">
                {index + 1}
              </text>
            </g>
          );
        })}

        <g
          transform={`translate(${frame.position.x} ${frame.position.y}) rotate(${frame.position.angleDegrees})`}
          filter={`url(#${shadowId})`}
          data-progress={frame.progress.toFixed(4)}
          data-waypoint-index={frame.position.waypointIndex}
          data-process-state={frame.objectState}
          pointerEvents="none"
        >
          <rect x={-RECT_WIDTH / 2} y={-RECT_HEIGHT / 2} width={RECT_WIDTH} height={RECT_HEIGHT} rx="8" fill={frame.boxColor} />
          <rect x={-RECT_WIDTH / 2 + 5} y={-RECT_HEIGHT / 2 + 5} width={RECT_WIDTH - 10} height={RECT_HEIGHT - 10} rx="5" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.5" />
          <text x="0" y="4" textAnchor="middle" fontSize="8" fontWeight="800" fill="#ffffff" letterSpacing="0.7">
            {shortStateLabel(stateAppearance.label)}
          </text>
        </g>
      </svg>
    </div>
  );
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
    x: ((clientX - rect.left) / Math.max(rect.width, 1)) * PROCESS_STAGE_WIDTH,
    y: ((clientY - rect.top) / Math.max(rect.height, 1)) * PROCESS_STAGE_HEIGHT,
  };
}

function shortStateLabel(label: string): string {
  return label.length > 8 ? label.slice(0, 8).toUpperCase() : label.toUpperCase();
}

function snap(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
