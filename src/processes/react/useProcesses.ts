import { useCallback, useEffect, useState } from "react";
import type { ProcessDefinition, ProcessSummary } from "../domain/process-definition";
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

export function useProcessDefinition(processId: string | undefined) {
  const library = useProcessLibrary();
  const [definition, setDefinition] = useState<ProcessDefinition | null>(null);
  const [loading, setLoading] = useState(Boolean(processId));
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!processId) {
      setDefinition(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setDefinition(await library.get(processId));
    } catch (cause) {
      setDefinition(null);
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
    }
  }, [library, processId]);

  useEffect(() => {
    void reload();
    return library.subscribe((event) => {
      if (event.processId === processId) void reload();
    });
  }, [library, processId, reload]);

  return { definition, loading, error, reload };
}
