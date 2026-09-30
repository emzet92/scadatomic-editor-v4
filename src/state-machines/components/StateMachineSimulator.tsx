import { RotateCcw, TimerReset, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button, PanelCard, SectionHeader, TextInput } from "../../shared/ui";
import type { StateMachineDefinition } from "../domain/state-machine-definition";
import { collectReferencedTagPaths } from "../application/StateMachineRuntime";
import { StateMachineSimulationSession } from "../simulation/StateMachineSimulationSession";
import { formatValue, parseValue } from "./ScratchBlocks";

export function StateMachineSimulator({ definition }: { definition: StateMachineDefinition }) {
  const session = useMemo(() => new StateMachineSimulationSession(definition), [definition]);
  const [, setRevision] = useState(0);
  const refresh = () => setRevision((value) => value + 1);

  useEffect(() => refresh(), [session]);

  const eventNames = [...new Set(definition.transitions
    .filter((item) => item.trigger.kind === "event")
    .map((item) => item.trigger.kind === "event" ? item.trigger.event : ""))]
    .filter(Boolean);
  const tagPaths = collectReferencedTagPaths(definition);
  const currentState = definition.states[session.instance.stateId];

  return (
    <PanelCard className="overflow-hidden p-0 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--editor-border)] px-4 py-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--editor-text)]"><Zap size={14} className="text-violet-600" /> Isolated simulator</div>
          <div className="mt-0.5 text-[10px] text-[var(--editor-text-muted)]">Virtual clock · local tags · no runtime side effects</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">{currentState?.name ?? session.instance.stateId}</div>
          <div className="font-mono text-[10px] text-zinc-500">t={session.now}ms</div>
          <Button size="icon-xs" variant="ghost" aria-label="Reset simulator" onClick={() => { session.reset(); refresh(); }}><RotateCcw size={13} /></Button>
        </div>
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-[1.05fr_1fr_1fr]">
        <div className="space-y-3">
          <SectionHeader title="Events" description="Send external events into the machine." />
          <div className="flex flex-wrap gap-2">
            {eventNames.length ? eventNames.map((event) => (
              <Button key={event} size="xs" variant="secondary" onClick={() => { session.send(event); refresh(); }}>{event}</Button>
            )) : <div className="text-[10px] text-zinc-500">No event-triggered transitions.</div>}
          </div>
          <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-3">
            {[100, 1000, 5000].map((ms) => (
              <Button key={ms} size="xs" variant="ghost" onClick={() => { session.advance(ms); refresh(); }}><TimerReset size={12} /> +{ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}</Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <SectionHeader title="Tag sandbox" description="Values are private to this simulator." />
          <div className="max-h-44 space-y-2 overflow-auto pr-1">
            {tagPaths.length ? tagPaths.map((path) => (
              <label key={path} className="grid grid-cols-[minmax(0,1fr)_110px] items-center gap-2">
                <span className="truncate font-mono text-[10px] text-zinc-600" title={path}>{path}</span>
                <TextInput
                  controlSize="sm"
                  mono
                  value={formatValue((session.getTag(path) as import("../domain/state-machine-definition").MachineValue | undefined) ?? null)}
                  onChange={(event) => { session.setTag(path, parseValue(event.target.value)); refresh(); }}
                />
              </label>
            )) : <div className="text-[10px] text-zinc-500">No guard tags referenced yet.</div>}
          </div>
        </div>

        <div className="space-y-3">
          <SectionHeader title="Produced intents" description="What the host runtime would execute." />
          <div className="max-h-44 space-y-1.5 overflow-auto rounded-lg bg-zinc-950 p-2.5 font-mono text-[9px] leading-4 text-zinc-300">
            {session.intents.length ? session.intents.slice(-12).map((entry, index) => (
              <div key={`${entry.at}-${index}`}><span className="text-zinc-500">{entry.at}ms</span> {formatIntent(entry.intent)}</div>
            )) : <div className="text-zinc-600">No intents yet.</div>}
          </div>
        </div>
      </div>
    </PanelCard>
  );
}

function formatIntent(intent: import("../domain/state-machine-intent").StateMachineIntent) {
  if (intent.type === "set-tag") return `set ${intent.path} = ${String(intent.value)}`;
  if (intent.type === "emit-event") return `emit ${intent.event}`;
  return `context ${intent.key} = ${String(intent.value)}`;
}
