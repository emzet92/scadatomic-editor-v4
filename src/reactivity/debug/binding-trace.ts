import type { RuntimePropertyBinding } from "../model/property-binding";

export type BindingTraceEntry = {
  bindingId: string;
  target: RuntimePropertyBinding["target"];
  status: "success" | "error";
  value?: unknown;
  message?: string;
  timestamp: number;
};

const MAX_TRACE = 200;
const traces: BindingTraceEntry[] = [];
const listeners = new Set<() => void>();

export function publishBindingTrace(entry: BindingTraceEntry) {
  traces.push(entry);
  while (traces.length > MAX_TRACE) traces.shift();
  for (const listener of listeners) listener();
}

export function getBindingTrace() {
  return [...traces];
}

export function subscribeBindingTrace(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
