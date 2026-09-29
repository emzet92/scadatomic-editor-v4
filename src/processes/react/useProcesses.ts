import { useCallback, useEffect, useRef, useState } from "react";
import type { ProcessDefinition, ProcessSummary } from "../domain/process-definition";
import { useProcessLibrary } from "./ProcessLibraryProvider";

export type ProcessListState = {
  items: ProcessSummary[];
  loading: boolean;
  error: string | null;
};

export type ProcessDefinitionOptions = {
  projectId?: string | undefined;
  /**
   * Runtime-friendly fallback. If the referenced process is missing (or no id
   * was configured), resolve the most recently saved process in this project.
   */
  fallbackToLatestProjectProcess?: boolean | undefined;
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

export function useProcessDefinition(
  processId: string | undefined,
  options: ProcessDefinitionOptions = {},
) {
  const library = useProcessLibrary();
  const projectId = options.projectId;
  const fallbackToLatest = options.fallbackToLatestProjectProcess === true;
  const [definition, setDefinition] = useState<ProcessDefinition | null>(null);
  const [loading, setLoading] = useState(Boolean(processId || (fallbackToLatest && projectId)));
  const [error, setError] = useState<string | null>(null);
  const reloadVersion = useRef(0);

  const reload = useCallback(async () => {
    const version = ++reloadVersion.current;
    if (!processId && !(fallbackToLatest && projectId)) {
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
      const exact = processId ? await library.get(processId) : null;
      const resolved = exact ?? (
        fallbackToLatest && projectId
          ? await library.getLatest(projectId)
          : null
      );
      if (version === reloadVersion.current) setDefinition(resolved);
    } catch (cause) {
      if (version === reloadVersion.current) {
        setDefinition(null);
        setError(cause instanceof Error ? cause.message : String(cause));
      }
    } finally {
      if (version === reloadVersion.current) setLoading(false);
    }
  }, [fallbackToLatest, library, processId, projectId]);

  useEffect(() => {
    void reload();
    return library.subscribe((event) => {
      if (event.processId === processId) {
        void reload();
        return;
      }
      if (fallbackToLatest && event.projectId === projectId) void reload();
    });
  }, [fallbackToLatest, library, processId, projectId, reload]);

  return { definition, loading, error, reload };
}
