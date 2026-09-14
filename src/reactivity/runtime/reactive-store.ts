import type { ReactiveKey, ReactiveRef } from "../model/reactive-ref";
import { toReactiveKey } from "../model/reactive-ref";

export type ReactiveChangeSource = {
  kind: string;
  id?: string | undefined;
};

export type ReactiveChange = {
  ref: ReactiveRef;
  previousValue: unknown;
  value: unknown;
  timestamp: number;
  source?: ReactiveChangeSource | undefined;
};

export type ReactiveSourceAdapter<TRef extends ReactiveRef = ReactiveRef> = {
  kind: TRef["kind"];
  read(ref: TRef): unknown;
  describe?(ref: TRef): string;
};

export type ReactiveChangeListener = (change: ReactiveChange) => void;

/**
 * Dependency/event hub only. Values remain owned by their source adapters
 * (TagStore today, memory/page/component state later), so the reactive layer
 * never becomes a second process-image cache.
 */
export class ReactiveStore {
  private readonly adapters = new Map<ReactiveRef["kind"], ReactiveSourceAdapter>();
  private readonly listeners = new Map<ReactiveKey, Set<ReactiveChangeListener>>();
  private readonly allListeners = new Set<ReactiveChangeListener>();

  registerSource<TRef extends ReactiveRef>(adapter: ReactiveSourceAdapter<TRef>) {
    this.adapters.set(adapter.kind, adapter as ReactiveSourceAdapter);
    return () => {
      if (this.adapters.get(adapter.kind) === adapter) {
        this.adapters.delete(adapter.kind);
      }
    };
  }

  read(ref: ReactiveRef): unknown {
    const adapter = this.adapters.get(ref.kind);
    if (!adapter) {
      throw new Error(`No reactive source adapter registered for ${ref.kind}.`);
    }
    return adapter.read(ref);
  }

  describe(ref: ReactiveRef): string {
    const adapter = this.adapters.get(ref.kind);
    return adapter?.describe?.(ref) ?? toReactiveKey(ref);
  }

  publish(change: ReactiveChange) {
    if (Object.is(change.previousValue, change.value)) return;
    const key = toReactiveKey(change.ref);
    for (const listener of this.listeners.get(key) ?? []) listener(change);
    for (const listener of this.allListeners) listener(change);
  }

  subscribe(ref: ReactiveRef, listener: ReactiveChangeListener) {
    const key = toReactiveKey(ref);
    const current = this.listeners.get(key) ?? new Set<ReactiveChangeListener>();
    current.add(listener);
    this.listeners.set(key, current);
    return () => {
      current.delete(listener);
      if (current.size === 0) this.listeners.delete(key);
    };
  }

  subscribeAll(listener: ReactiveChangeListener) {
    this.allListeners.add(listener);
    return () => this.allListeners.delete(listener);
  }
}
