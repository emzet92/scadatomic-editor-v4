import type { ProcessDefinition } from "../domain/process-definition";

/**
 * Explicit process lookup policy used by Designer/runtime components.
 *
 * `exact` never falls back to another definition. `project-default` is the only
 * mode allowed to resolve the latest/default process for a project.
 */
export type ProcessSource =
  | { kind: "exact"; processId: string }
  | { kind: "project-default"; projectId: string };

export interface ProcessDefinitionReader {
  get(processId: string): Promise<ProcessDefinition | null>;
  getDefault(projectId: string): Promise<ProcessDefinition | null>;
}

export function exactProcessSource(processId: string): ProcessSource {
  return { kind: "exact", processId };
}

export function projectDefaultProcessSource(projectId: string): ProcessSource {
  return { kind: "project-default", projectId };
}

export function processSourceKey(source: ProcessSource): string {
  return source.kind === "exact"
    ? `exact:${source.processId}`
    : `project-default:${source.projectId}`;
}

export async function resolveProcessSource(
  reader: ProcessDefinitionReader,
  source: ProcessSource,
): Promise<ProcessDefinition | null> {
  return source.kind === "exact"
    ? reader.get(source.processId)
    : reader.getDefault(source.projectId);
}

export function processSourceMatchesChange(
  source: ProcessSource,
  event: { processId: string; projectId: string },
): boolean {
  return source.kind === "exact"
    ? event.processId === source.processId
    : event.projectId === source.projectId;
}
