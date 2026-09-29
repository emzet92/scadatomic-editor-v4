import type { AnimationPath } from "./process-path";
import type { ProcessScene } from "./process-scene";
import type { ProcessObjectState } from "./process-path";

export const PROCESS_DEFINITION_SCHEMA_VERSION = 1 as const;

export type ProcessProgressTagBinding = {
  tagPath: string;
  /** Raw tag value mapped to progress=0. */
  inputMin: number;
  /** Raw tag value mapped to progress=1. */
  inputMax: number;
};

export type ProcessStateTagBinding = {
  tagPath: string;
  /** Optional mapping for PLC-specific values such as RUN/OK/NOK. */
  mapping?: Readonly<Record<string, ProcessObjectState>> | undefined;
};

export type ProcessBooleanTagBinding = {
  tagPath: string;
  /** Defaults to true. Useful for inverted/photoelectric signals. */
  activeValue?: boolean | undefined;
};

export type ProcessTagBindings = {
  progress?: ProcessProgressTagBinding | undefined;
  objectState?: ProcessStateTagBinding | undefined;
  sensors?: Readonly<Record<string, ProcessBooleanTagBinding>> | undefined;
};

export type ProcessPlaybackConfig = {
  durationSeconds: number;
  loopMode: "loop" | "once";
};

/**
 * Persisted aggregate edited by the Animation/Process workspace.
 *
 * UiNodes only reference this object by processId. Keeping the process outside
 * the document prevents copying large geometry blobs into every component
 * instance and gives all instances one versioned source of truth.
 */
export type ProcessDefinition = {
  schemaVersion: typeof PROCESS_DEFINITION_SCHEMA_VERSION;
  id: string;
  projectId: string;
  name: string;
  path: AnimationPath;
  scene: ProcessScene;
  playback: ProcessPlaybackConfig;
  bindings: ProcessTagBindings;
  createdAt: number;
  updatedAt: number;
};

export type ProcessDefinitionDraft = Omit<
  ProcessDefinition,
  "schemaVersion" | "createdAt" | "updatedAt"
> & {
  createdAt?: number | undefined;
  updatedAt?: number | undefined;
};

export type ProcessSummary = Pick<
  ProcessDefinition,
  "id" | "projectId" | "name" | "updatedAt"
>;

export function createProcessDefinition(draft: ProcessDefinitionDraft): ProcessDefinition {
  const now = Date.now();
  return {
    schemaVersion: PROCESS_DEFINITION_SCHEMA_VERSION,
    ...cloneProcessDraft(draft),
    createdAt: draft.createdAt ?? now,
    updatedAt: draft.updatedAt ?? now,
  };
}

export function cloneProcessDefinition(definition: ProcessDefinition): ProcessDefinition {
  return structuredClone(definition);
}

function cloneProcessDraft(draft: ProcessDefinitionDraft): ProcessDefinitionDraft {
  return {
    ...draft,
    path: {
      ...draft.path,
      points: draft.path.points.map((point) => ({
        ...point,
        ...(point.changes ? { changes: { ...point.changes } } : {}),
      })),
    },
    scene: {
      zones: draft.scene.zones.map((zone) => ({ ...zone })),
      sensors: draft.scene.sensors.map((sensor) => ({ ...sensor })),
    },
    playback: { ...draft.playback },
    bindings: {
      ...(draft.bindings.progress ? { progress: { ...draft.bindings.progress } } : {}),
      ...(draft.bindings.objectState
        ? {
            objectState: {
              ...draft.bindings.objectState,
              ...(draft.bindings.objectState.mapping
                ? { mapping: { ...draft.bindings.objectState.mapping } }
                : {}),
            },
          }
        : {}),
      ...(draft.bindings.sensors
        ? {
            sensors: Object.fromEntries(
              Object.entries(draft.bindings.sensors).map(([sensorId, binding]) => [
                sensorId,
                { ...binding },
              ]),
            ),
          }
        : {}),
    },
  };
}
