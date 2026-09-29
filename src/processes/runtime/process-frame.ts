import type { ProcessObjectState } from "../domain/process-path";
import type { AnimationPath } from "../domain/process-path";
import type { ProcessScene, ProcessSensor, ProcessZone } from "../domain/process-scene";
import { DEFAULT_PROCESS_OBJECT_STATE, getProcessStateAppearance } from "../domain/process-state";
import { resolveWaypointChanges } from "../domain/waypoint-changes";
import { buildPathMetrics, samplePath } from "./path-sampler";

export type ProcessFrameOverrides = {
  objectState?: ProcessObjectState | undefined;
  sensorStates?: Readonly<Record<string, boolean>> | undefined;
};

export type ProcessFrame = {
  progress: number;
  position: ReturnType<typeof samplePath>;
  objectState: ProcessObjectState;
  boxColor: string;
  activeZones: readonly ProcessZone[];
  activeSensors: readonly ProcessSensor[];
};

export function resolveProcessFrame(
  path: AnimationPath,
  scene: ProcessScene,
  progress: number,
  overrides: ProcessFrameOverrides = {},
): ProcessFrame {
  const metrics = buildPathMetrics(path);
  const position = samplePath(path, progress, metrics);
  const waypointChanges = resolveWaypointChanges(path, position.waypointIndex);
  const objectState = overrides.objectState ?? waypointChanges.objectState ?? DEFAULT_PROCESS_OBJECT_STATE;
  const stateAppearance = getProcessStateAppearance(objectState);
  const boxColor = waypointChanges.boxColor ?? stateAppearance.color;
  const activeZones = scene.zones.filter((zone) =>
    isPointInsideZone(position.x, position.y, zone),
  );
  const activeSensors = scene.sensors.filter((sensor) => {
    const explicit = overrides.sensorStates?.[sensor.id];
    return explicit ?? isSensorTriggered(position.x, position.y, sensor);
  });

  return {
    progress,
    position,
    objectState,
    boxColor,
    activeZones,
    activeSensors,
  };
}

export function isPointInsideZone(x: number, y: number, zone: ProcessZone): boolean {
  return x >= zone.x && x <= zone.x + zone.width && y >= zone.y && y <= zone.y + zone.height;
}

export function isSensorTriggered(x: number, y: number, sensor: ProcessSensor): boolean {
  return Math.hypot(x - sensor.x, y - sensor.y) <= sensor.triggerRadius;
}
