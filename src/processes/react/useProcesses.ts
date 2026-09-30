import { useCallback, useEffect, useRef, useState } from "react";
import type { ProcessDefinition, ProcessSummary } from "../domain/process-definition";
import {
  exactProcessSource,
  processSourceMatchesChange,
  projectDefaultProcessSource,
  resolveProcessSource,
  type ProcessSource,
} from "../application/ProcessSource";
import { useProcessLibrary } from "./ProcessLibraryProvider";

export type ProcessListState = {
  items: ProcessSummary[];
  loading: boolean;
  error: string | null;
};

export function useProcesses(projectId: string | undefined): ProcessListState {
  const library = useProcessLibrary();
  const [state, setState] = useState<ProcessListState>({ items: [], loading: true, error: null });

  const reload = useCallback(async () => {
    if (!projectId) {
      setState({ items: [], loading: false, error: null });
      return;
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const items = await library.list(projectId);
      setState({ items, loading: false, error: null });
    } catch (error) {
      setState({
        items: [],
        loading: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [library, projectId]);

  useEffect(() => {
    void reload();
    return library.subscribe((event) => {
      if (event.projectId === projectId) void reload();
    });
  }, [library, projectId, reload]);

  return state;
}

export function useProcessDefinition(source: ProcessSource | null | undefined) {
  const library = useProcessLibrary();
  const sourceKind = source?.kind ?? null;
  const exactProcessId = source?.kind === "exact" ? source.processId : null;
  const defaultProjectId = source?.kind === "project-default" ? source.projectId : null;
  const [definition, setDefinition] = useState<ProcessDefinition | null>(null);
  const [loading, setLoading] = useState(Boolean(source));
  const [error, setError] = useState<string | null>(null);
  const reloadVersion = useRef(0);

  const reload = useCallback(async () => {
    const version = ++reloadVersion.current;
    const currentSource = sourceKind === "exact" && exactProcessId
      ? exactProcessSource(exactProcessId)
      : sourceKind === "project-default" && defaultProjectId
        ? projectDefaultProcessSource(defaultProjectId)
        : null;

    if (!currentSource) {
      if (version === reloadVersion.current) {
        setDefinition(null);
        setLoading(false);
        setError(null);
      }
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const resolved = await resolveProcessSource(library, currentSource);
      if (version === reloadVersion.current) setDefinition(resolved);
    } catch (cause) {
      if (version === reloadVersion.current) {
        setDefinition(null);
        setError(cause instanceof Error ? cause.message : String(cause));
      }
    } finally {
      if (version === reloadVersion.current) setLoading(false);
    }
  }, [defaultProjectId, exactProcessId, library, sourceKind]);

  useEffect(() => {
    void reload();
    return library.subscribe((event) => {
      const currentSource = sourceKind === "exact" && exactProcessId
        ? exactProcessSource(exactProcessId)
        : sourceKind === "project-default" && defaultProjectId
          ? projectDefaultProcessSource(defaultProjectId)
          : null;
      if (currentSource && processSourceMatchesChange(currentSource, event)) void reload();
    });
  }, [defaultProjectId, exactProcessId, library, reload, sourceKind]);

  return { definition, loading, error, reload };
}
