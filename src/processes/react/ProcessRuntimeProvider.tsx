import { createContext, useContext, type ReactNode } from "react";
import type { ProcessTagSource } from "../application/ProcessTagSource";

export type ProcessRuntimeContextValue = {
  projectId: string;
  tagSource: ProcessTagSource;
};

const ProcessRuntimeContext = createContext<ProcessRuntimeContextValue | null>(null);

/**
 * Composition boundary between the generic process renderer and a concrete
 * runtime. The process module only depends on ProcessTagSource, never on the
 * runtime tag bridge implementation.
 */
export function ProcessRuntimeProvider({
  value,
  children,
}: {
  value: ProcessRuntimeContextValue;
  children: ReactNode;
}) {
  return (
    <ProcessRuntimeContext.Provider value={value}>
      {children}
    </ProcessRuntimeContext.Provider>
  );
}

export function useProcessRuntime(): ProcessRuntimeContextValue {
  const value = useContext(ProcessRuntimeContext);
  if (!value) {
    throw new Error("ProcessRuntimeProvider is missing from the runtime composition root.");
  }
  return value;
}
