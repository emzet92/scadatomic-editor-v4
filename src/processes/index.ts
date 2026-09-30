// Public process-module API. External modules should import from here instead of
// reaching into domain/application/infrastructure internals.
export type {
  AnimationPath,
  AnimationWaypoint,
  AnimationWaypointChanges,
  ProcessObjectState,
} from "./domain/process-path";
export { conveyorDemoPath } from "./domain/process-path";
export type { ProcessScene, ProcessSensor, ProcessZone, ProcessZoneKind } from "./domain/process-scene";
export { conveyorDemoScene } from "./domain/process-scene";
export {
  DEFAULT_PROCESS_OBJECT_STATE,
  getProcessStateAppearance,
  processStateAppearances,
} from "./domain/process-state";
export type {
  ProcessDefinition,
  ProcessPlaybackConfig,
  ProcessTagBindings,
  ProcessProgressTagBinding,
  ProcessStateTagBinding,
  ProcessBooleanTagBinding,
  ProcessSummary,
} from "./domain/process-definition";
export { createProcessDefinition } from "./domain/process-definition";
export { normalizeProcessProgress, resolveProcessObjectState } from "./domain/process-values";
export { resolveWaypointChanges } from "./domain/waypoint-changes";
export { buildPathMetrics, samplePath } from "./runtime/path-sampler";
export { resolveProcessFrame } from "./runtime/process-frame";
export { ProcessCanvas } from "./components/ProcessCanvas";
export { ProcessComponent } from "./components/ProcessComponent";
export { RuntimeProcessComponent } from "./components/RuntimeProcessComponent";
export { ProcessLibrary } from "./application/ProcessLibrary";
export type { ProcessChangeBus, ProcessLibraryEvent } from "./application/ProcessChangeBus";
export type { ProcessRepository } from "./application/ProcessRepository";
export type { ProcessSource, ProcessDefinitionReader } from "./application/ProcessSource";
export {
  exactProcessSource,
  projectDefaultProcessSource,
  processSourceKey,
  processSourceMatchesChange,
  resolveProcessSource,
} from "./application/ProcessSource";
export type { ProcessTagSource, ResolvedProcessBindingValues } from "./application/ProcessTagSource";
export { listProcessBindingPaths, resolveProcessBindingValues } from "./application/ProcessTagSource";
export { IndexedDbProcessRepository } from "./infrastructure/IndexedDbProcessRepository";
export { BrowserProcessChangeBus } from "./infrastructure/BrowserProcessChangeBus";
export { ProcessLibraryProvider, useProcessLibrary } from "./react/ProcessLibraryProvider";
export { ProcessRuntimeProvider, useProcessRuntime } from "./react/ProcessRuntimeProvider";
export type { ProcessRuntimeContextValue } from "./react/ProcessRuntimeProvider";
export { useProcessDefinition, useProcesses } from "./react/useProcesses";
export { useResolvedProcessBindings } from "./react/useProcessBindings";
