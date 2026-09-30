import { useMemo, useState } from "react";
import { isAlarmRetained, isAlarmVisible } from "../domain/alarm-instance";
import { useAlarmRuntime } from "../react/AlarmRuntimeProvider";
import { useAlarmHistory } from "../react/useAlarms";

export function RuntimeAlarmConsole({ projectId, onClose }: { projectId: string; onClose(): void }) {
  const { runtime, snapshot } = useAlarmRuntime();
  const { events } = useAlarmHistory(projectId);
  const [tab, setTab] = useState<"active" | "shelved" | "history">("active");
  const [selectedAlarmId, setSelectedAlarmId] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [historyPriority, setHistoryPriority] = useState("all");
  const [historyType, setHistoryType] = useState("all");
  const now = Date.now();
  const active = useMemo(() => snapshot.filter(({ instance }) => (instance.active || isAlarmRetained(instance)) && isAlarmVisible(instance, now)), [snapshot, now]);
  const shelved = useMemo(() => snapshot.filter(({ instance }) => typeof instance.shelvedUntil === "number" && instance.shelvedUntil > now), [snapshot, now]);
  const selected = snapshot.find(({ definition }) => definition.id === selectedAlarmId) ?? null;
  const filteredEvents = useMemo(() => {
    const query = historySearch.trim().toLowerCase();
    return events.filter((event) => (historyPriority === "all" || event.priority === historyPriority) && (historyType === "all" || event.type === historyType) && (!query || `${event.sourcePath} ${event.message} ${event.actor ?? ""}`.toLowerCase().includes(query)));
  }, [events, historyPriority, historySearch, historyType]);

  return (
    <div className="fixed inset-0 z-[1100] overflow-auto bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-6 py-4 backdrop-blur">
        <div><h1 className="text-lg font-semibold">Alarm console</h1><p className="text-xs text-zinc-500">{projectId} · runtime operations</p></div>
        <button onClick={onClose} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs hover:bg-zinc-900">Close</button>
      </header>
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-5 flex gap-2">
          {(["active", "shelved", "history"] as const).map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-lg px-3 py-2 text-xs font-medium ${tab === item ? "bg-violet-600 text-white" : "bg-zinc-900 text-zinc-400"}`}>{item === "active" ? `Active (${active.length})` : item === "shelved" ? `Shelved (${shelved.length})` : `History (${events.length})`}</button>)}
        </div>

        {tab === "history" ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Search source or message" className="h-9 min-w-64 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs outline-none" />
              <select value={historyPriority} onChange={(event) => setHistoryPriority(event.target.value)} className="h-9 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs"><option value="all">All priorities</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
              <select value={historyType} onChange={(event) => setHistoryType(event.target.value)} className="h-9 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs"><option value="all">All events</option><option value="activated">Activated</option><option value="acknowledged">Acknowledged</option><option value="returned-to-normal">Returned</option><option value="shelved">Shelved</option><option value="unshelved">Unshelved</option><option value="suppressed">Suppressed</option><option value="unsuppressed">Unsuppressed</option></select>
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-800">
            <table className="w-full text-left text-xs"><thead className="bg-zinc-900 text-zinc-400"><tr><th className="px-4 py-3">Time</th><th>Event</th><th>Priority</th><th>Source</th><th>Message</th><th>Actor</th></tr></thead>
              <tbody>{filteredEvents.map((event) => <tr key={event.id} className="border-t border-zinc-900"><td className="px-4 py-3 font-mono text-zinc-400">{formatTime(event.timestamp)}</td><td>{event.type}</td><td className={priorityClass(event.priority)}>{event.priority}</td><td className="font-mono text-zinc-400">{event.sourcePath}</td><td>{event.message}</td><td className="text-zinc-500">{event.actor ?? "—"}</td></tr>)}</tbody>
            </table>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="overflow-hidden rounded-xl border border-zinc-800">
              <table className="w-full text-left text-xs"><thead className="bg-zinc-900 text-zinc-400"><tr><th className="px-4 py-3">ACK</th><th>Priority</th><th>Source</th><th>Message</th><th>Since</th><th /></tr></thead>
                <tbody>{(tab === "active" ? active : shelved).map(({ definition, instance }) => <tr key={definition.id} onClick={() => setSelectedAlarmId(definition.id)} className="cursor-pointer border-t border-zinc-900 hover:bg-zinc-900/70"><td className="px-4 py-3">{instance.acknowledged ? "✓" : "●"}</td><td className={priorityClass(definition.priority)}>{definition.priority}</td><td className="font-mono text-zinc-400">{definition.source.path}</td><td>{definition.message}</td><td className="text-zinc-500">{instance.activeSince ? formatTime(instance.activeSince) : "—"}</td><td className="pr-4 text-right">{!instance.acknowledged ? <button className="rounded bg-zinc-800 px-2 py-1" onClick={(event) => { event.stopPropagation(); void runtime.acknowledge(definition.id); }}>ACK</button> : null}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              {selected ? <AlarmRuntimeDetail pair={selected} onAck={() => void runtime.acknowledge(selected.definition.id)} onShelve={(ms) => void runtime.shelve(selected.definition.id, ms)} onUnshelve={() => void runtime.unshelve(selected.definition.id)} /> : <p className="text-sm text-zinc-500">Select an alarm for details.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AlarmRuntimeDetail({ pair, onAck, onShelve, onUnshelve }: { pair: ReturnType<typeof useAlarmRuntime>["snapshot"][number]; onAck(): void; onShelve(ms: number): void; onUnshelve(): void }) {
  const { definition, instance } = pair;
  return <div className="space-y-4"><div><div className={`text-xs font-semibold uppercase ${priorityClass(definition.priority)}`}>{definition.priority}</div><h2 className="mt-1 text-base font-semibold">{definition.message}</h2><p className="mt-1 font-mono text-xs text-zinc-500">{definition.source.path}</p></div>
    <dl className="grid grid-cols-2 gap-3 text-xs"><div><dt className="text-zinc-500">Value</dt><dd className="mt-1 font-mono">{String(instance.lastValue ?? "—")}</dd></div><div><dt className="text-zinc-500">ACK</dt><dd className="mt-1">{instance.acknowledged ? "Acknowledged" : "Required"}</dd></div></dl>
    {definition.cause ? <Info label="Cause" value={definition.cause} /> : null}{definition.consequence ? <Info label="Consequence" value={definition.consequence} /> : null}{definition.operatorResponse ? <Info label="Operator response" value={definition.operatorResponse} /> : null}
    <div className="flex flex-wrap gap-2">{!instance.acknowledged ? <button className="rounded bg-violet-600 px-3 py-2 text-xs font-medium" onClick={onAck}>Acknowledge</button> : null}{instance.shelvedUntil ? <button className="rounded bg-zinc-800 px-3 py-2 text-xs" onClick={onUnshelve}>Unshelve</button> : <><button className="rounded bg-zinc-800 px-3 py-2 text-xs" onClick={() => onShelve(10 * 60_000)}>Shelve 10m</button><button className="rounded bg-zinc-800 px-3 py-2 text-xs" onClick={() => onShelve(60 * 60_000)}>Shelve 1h</button></>}</div>
  </div>;
}
function Info({ label, value }: { label: string; value: string }) { return <div><div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</div><p className="mt-1 text-xs leading-5 text-zinc-300">{value}</p></div>; }
function formatTime(timestamp: number) { return new Date(timestamp).toLocaleString(); }
function priorityClass(priority: string) { return priority === "critical" ? "text-red-400" : priority === "high" ? "text-orange-400" : priority === "medium" ? "text-amber-300" : "text-sky-300"; }
