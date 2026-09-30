import { useEffect, useState } from "react";
import type { StateMachineSummary } from "../domain/state-machine-definition";
import { useStateMachineLibrary } from "./StateMachineLibraryProvider";

export function useStateMachines(projectId: string | undefined) {
  const library = useStateMachineLibrary();
  const [items, setItems] = useState<StateMachineSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!projectId) { setItems([]); return; }
    const reload = () => void library.list(projectId).then((value) => { if (!cancelled) setItems(value); });
    reload();
    const unsubscribe = library.subscribe((event) => { if (event.projectId === projectId) reload(); });
    return () => { cancelled = true; unsubscribe(); };
  }, [library, projectId]);

  return items;
}
