import type { ProcessTagBindings } from "../domain/process-definition";
import type { ProcessObjectState } from "../domain/process-path";
import { normalizeProcessProgress, resolveProcessObjectState } from "../domain/process-values";

/** Read-only live tag port consumed by process visualization. */
export interface ProcessTagSource {
  read(path: string): unknown;
  subscribe(path: string, listener: () => void): () => void;
}

export type ResolvedProcessBindingValues = {
  progress?: number | undefined;
  objectState?: ProcessObjectState | undefined;
  sensorStates: Record<string, boolean>;
};

export function listProcessBindingPaths(bindings: ProcessTagBindings): string[] {
  return [
    bindings.progress?.tagPath,
    bindings.objectState?.tagPath,
    ...Object.values(bindings.sensors ?? {}).map((binding) => binding.tagPath),
  ].filter((value): value is string => Boolean(value));
}

/** One binding resolver shared by animator preview and runtime rendering. */
export function resolveProcessBindingValues(
  bindings: ProcessTagBindings,
  source: ProcessTagSource | null,
): ResolvedProcessBindingValues {
  if (!source) return { sensorStates: {} };

  const progress = bindings.progress
    ? normalizeProcessProgress(source.read(bindings.progress.tagPath), bindings.progress)
    : undefined;
  const objectState = bindings.objectState
    ? resolveProcessObjectState(source.read(bindings.objectState.tagPath), bindings.objectState)
    : undefined;
  const sensorStates = Object.fromEntries(
    Object.entries(bindings.sensors ?? {}).map(([sensorId, binding]) => [
      sensorId,
      source.read(binding.tagPath) === (binding.activeValue ?? true),
    ]),
  );

  return { progress, objectState, sensorStates };
}
