import { useEffect, useMemo, useReducer } from "react";
import {
  listProcessBindingPaths,
  resolveProcessBindingValues,
  type ProcessTagSource,
  type ResolvedProcessBindingValues,
} from "../application/ProcessTagSource";
import type { ProcessTagBindings } from "../domain/process-definition";

/**
 * Shared reactive adapter for process tag bindings.
 *
 * Both animator preview and runtime rendering use this hook so subscription,
 * de-duplication and binding resolution cannot drift apart.
 */
export function useResolvedProcessBindings(
  bindings: ProcessTagBindings,
  source: ProcessTagSource | null,
): ResolvedProcessBindingValues {
  const [, invalidate] = useReducer((version: number) => version + 1, 0);
  const paths = useMemo(() => listProcessBindingPaths(bindings), [bindings]);

  useEffect(() => {
    if (!source || paths.length === 0) return undefined;
    const unsubscribes = [...new Set(paths)].map((path) =>
      source.subscribe(path, invalidate),
    );
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [paths, source]);

  return resolveProcessBindingValues(bindings, source);
}
