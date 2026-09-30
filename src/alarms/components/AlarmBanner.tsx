import { isAlarmRetained, isAlarmVisible } from "../domain/alarm-instance";
import { useAlarmRuntime } from "../react/AlarmRuntimeProvider";

export function AlarmBanner({ onOpen }: { onOpen(): void }) {
  const { snapshot } = useAlarmRuntime();
  const now = Date.now();
  const visible = snapshot.filter(({ instance }) => (instance.active || isAlarmRetained(instance)) && isAlarmVisible(instance, now));
  const unack = visible.filter(({ instance }) => !instance.acknowledged).length;
  const critical = visible.filter(({ definition }) => definition.priority === "critical").length;

  if (visible.length === 0) return null;
  return (
    <button type="button" onClick={onOpen} className="fixed left-1/2 top-3 z-[1000] flex -translate-x-1/2 items-center gap-3 rounded-xl border border-red-700/40 bg-zinc-950/95 px-4 py-2 text-xs text-white shadow-2xl backdrop-blur">
      <span className="font-semibold text-red-300">{visible.length} alarm{visible.length === 1 ? "" : "s"}</span>
      {critical > 0 ? <span className="rounded bg-red-500/15 px-2 py-0.5 text-red-300">{critical} critical</span> : null}
      {unack > 0 ? <span className="rounded bg-amber-500/15 px-2 py-0.5 text-amber-300">{unack} unack</span> : null}
      <span className="text-zinc-400">Open alarms</span>
    </button>
  );
}
