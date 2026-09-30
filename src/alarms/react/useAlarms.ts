import { useCallback, useEffect, useState } from "react";
import type { AlarmDefinition, AlarmDefinitionSummary } from "../domain/alarm-definition";
import type { AlarmEvent } from "../domain/alarm-event";
import { useAlarmLibrary } from "./AlarmLibraryProvider";

export function useAlarmDefinitions(projectId: string | undefined) {
  const library = useAlarmLibrary();
  const [items, setItems] = useState<AlarmDefinitionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    if (!projectId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    try { setItems(await library.list(projectId)); setError(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setLoading(false); }
  }, [library, projectId]);
  useEffect(() => {
    void reload();
    return library.subscribe((event) => { if (event.projectId === projectId && (event.kind === "saved" || event.kind === "deleted")) void reload(); });
  }, [library, projectId, reload]);
  return { items, loading, error, reload };
}

export function useAlarmDefinition(alarmId: string | null | undefined) {
  const library = useAlarmLibrary();
  const [definition, setDefinition] = useState<AlarmDefinition | null>(null);
  const [loading, setLoading] = useState(Boolean(alarmId));
  const reload = useCallback(async () => {
    if (!alarmId) { setDefinition(null); setLoading(false); return; }
    setLoading(true);
    try { setDefinition(await library.get(alarmId)); }
    finally { setLoading(false); }
  }, [alarmId, library]);
  useEffect(() => {
    void reload();
    return library.subscribe((event) => { if (event.alarmId === alarmId && (event.kind === "saved" || event.kind === "deleted")) void reload(); });
  }, [alarmId, library, reload]);
  return { definition, loading, reload };
}

export function useAlarmHistory(projectId: string | undefined, alarmId?: string | undefined) {
  const library = useAlarmLibrary();
  const [events, setEvents] = useState<AlarmEvent[]>([]);
  const reload = useCallback(async () => {
    if (!projectId) { setEvents([]); return; }
    setEvents(await library.listEvents(projectId, { ...(alarmId ? { alarmId } : {}), limit: 1000 }));
  }, [alarmId, library, projectId]);
  useEffect(() => {
    void reload();
    return library.subscribe((event) => { if (event.projectId === projectId && event.kind === "event") void reload(); });
  }, [library, projectId, reload]);
  return { events, reload };
}
