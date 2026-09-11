import { useSyncExternalStore } from "react";
import { MAX_CHART_TIME_RANGE_MS } from "./chart-time-range";

type Listener = () => void;

export type RuntimeSignalSample = {
  timestamp: number;
  value: unknown;
};

/**
 * Runtime trend history is intentionally lighter than the live signal stream.
 * Live values are still updated for every tag.changed event, while history
 * samples that arrive very close together are coalesced. This keeps a useful
 * 10-minute trend window without retaining every simulation tick.
 */
export const RUNTIME_SIGNAL_HISTORY_COALESCE_MS = 250;
export const RUNTIME_SIGNAL_HISTORY_RETENTION_MS = MAX_CHART_TIME_RANGE_MS;

const EMPTY_HISTORY: readonly RuntimeSignalSample[] = [];

class RuntimeSignalStore {
  private readonly values = new Map<string, unknown>();
  private readonly histories = new Map<
    string,
    readonly RuntimeSignalSample[]
  >();
  private readonly listeners = new Map<string, Set<Listener>>();

  get(tag: string) {
    return this.values.get(tag);
  }

  getHistory(tag: string) {
    return this.histories.get(tag) ?? EMPTY_HISTORY;
  }

  set(tag: string, value: unknown) {
    if (Object.is(this.values.get(tag), value)) {
      return;
    }

    this.values.set(tag, value);

    const now = Date.now();
    const currentHistory = this.histories.get(tag) ?? EMPTY_HISTORY;
    const nextSample: RuntimeSignalSample = {
      timestamp: now,
      value,
    };
    const lastSample = currentHistory[currentHistory.length - 1];

    const appendedHistory =
      lastSample && now - lastSample.timestamp < RUNTIME_SIGNAL_HISTORY_COALESCE_MS
        ? [...currentHistory.slice(0, -1), nextSample]
        : [...currentHistory, nextSample];

    this.histories.set(
      tag,
      pruneHistory(
        appendedHistory,
        now - RUNTIME_SIGNAL_HISTORY_RETENTION_MS,
      ),
    );

    for (const listener of this.listeners.get(tag) ?? []) {
      listener();
    }
  }

  subscribe(tag: string, listener: Listener) {
    const current = this.listeners.get(tag) ?? new Set<Listener>();
    current.add(listener);
    this.listeners.set(tag, current);

    return () => {
      current.delete(listener);
      if (current.size === 0) {
        this.listeners.delete(tag);
      }
    };
  }
}

function pruneHistory(
  history: readonly RuntimeSignalSample[],
  cutoffTimestamp: number,
): readonly RuntimeSignalSample[] {
  const firstWithinRange = history.findIndex(
    (sample) => sample.timestamp >= cutoffTimestamp,
  );

  // Keep one predecessor sample. A relative trend needs it to reconstruct the
  // value that was active exactly at the left edge of the visible time window.
  if (firstWithinRange > 1) {
    return history.slice(firstWithinRange - 1);
  }

  if (firstWithinRange === -1 && history.length > 1) {
    return history.slice(-1);
  }

  return history;
}

export const runtimeSignals = new RuntimeSignalStore();

export function useRuntimeSignal(tag: string | undefined) {
  return useSyncExternalStore(
    (listener) => (tag ? runtimeSignals.subscribe(tag, listener) : () => {}),
    () => (tag ? runtimeSignals.get(tag) : undefined),
    () => undefined
  );
}

export function useRuntimeSignalHistory(tag: string | undefined) {
  return useSyncExternalStore(
    (listener) => (tag ? runtimeSignals.subscribe(tag, listener) : () => {}),
    () => (tag ? runtimeSignals.getHistory(tag) : EMPTY_HISTORY),
    () => EMPTY_HISTORY
  );
}
