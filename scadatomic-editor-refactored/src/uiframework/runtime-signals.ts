import { useSyncExternalStore } from "react";

type Listener = () => void;

export type RuntimeSignalSample = {
  timestamp: number;
  value: unknown;
};

const MAX_HISTORY_PER_TAG = 1000;
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

    const currentHistory = this.histories.get(tag) ?? EMPTY_HISTORY;
    const nextHistory = [
      ...currentHistory,
      {
        timestamp: Date.now(),
        value,
      },
    ].slice(-MAX_HISTORY_PER_TAG);

    this.histories.set(tag, nextHistory);

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
