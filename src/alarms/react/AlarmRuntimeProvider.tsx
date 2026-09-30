import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AlarmRuntime } from "../application/AlarmRuntime";
import type { AlarmScheduler, AlarmValueSource, Clock } from "../application/AlarmPorts";
import type { AlarmDefinition } from "../domain/alarm-definition";
import type { AlarmInstance } from "../domain/alarm-instance";
import { useAlarmLibrary } from "./AlarmLibraryProvider";

export type AlarmRuntimeSnapshot = Array<{ definition: AlarmDefinition; instance: AlarmInstance }>;

type ContextValue = {
  runtime: AlarmRuntime;
  snapshot: AlarmRuntimeSnapshot;
};

const AlarmRuntimeContext = createContext<ContextValue | null>(null);

export function AlarmRuntimeProvider({ projectId, valueSource, clock, scheduler, children }: {
  projectId: string;
  valueSource: AlarmValueSource;
  clock: Clock;
  scheduler: AlarmScheduler;
  children: ReactNode;
}) {
  const library = useAlarmLibrary();
  const runtime = useMemo(() => new AlarmRuntime(projectId, library, valueSource, clock, scheduler), [clock, library, projectId, scheduler, valueSource]);
  const [snapshot, setSnapshot] = useState<AlarmRuntimeSnapshot>([]);

  useEffect(() => {
    let active = true;
    const unsubscribe = runtime.subscribe(() => { if (active) setSnapshot(runtime.snapshot()); });
    void runtime.start().then(() => { if (active) setSnapshot(runtime.snapshot()); });
    return () => { active = false; unsubscribe(); runtime.stop(); };
  }, [runtime]);

  return <AlarmRuntimeContext.Provider value={{ runtime, snapshot }}>{children}</AlarmRuntimeContext.Provider>;
}

export function useAlarmRuntime(): ContextValue {
  const value = useContext(AlarmRuntimeContext);
  if (!value) throw new Error("AlarmRuntimeProvider is missing from the runtime composition root.");
  return value;
}
