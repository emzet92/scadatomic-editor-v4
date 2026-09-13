import type { HandlerExecution } from "../runtime/handler-execution";

const STORAGE_PREFIX = "scadatomic.execution-trace.v1.";
const localListeners = new Set<(execution: HandlerExecution) => void>();
let channel: BroadcastChannel | undefined;

function getChannel(): BroadcastChannel | undefined {
  if (typeof BroadcastChannel === "undefined") return undefined;
  channel ??= new BroadcastChannel("scadatomic.execution-trace.v1");
  return channel;
}

export function publishExecutionTrace(execution: HandlerExecution): void {
  const safeExecution = makeSerializable(execution);
  try {
    localStorage.setItem(storageKey(execution.projectId, execution.handlerId), JSON.stringify(safeExecution));
  } catch {
    // Debug trace persistence is best effort only.
  }

  for (const listener of localListeners) listener(safeExecution);
  try {
    getChannel()?.postMessage(safeExecution);
  } catch {
    // Cross-tab debugging is best effort only.
  }
}

export function getLatestExecutionTrace(
  projectId: string,
  handlerId: string
): HandlerExecution | null {
  try {
    const raw = localStorage.getItem(storageKey(projectId, handlerId));
    return raw ? (JSON.parse(raw) as HandlerExecution) : null;
  } catch {
    return null;
  }
}

export function subscribeExecutionTrace(
  projectId: string,
  handlerId: string,
  listener: (execution: HandlerExecution) => void
): () => void {
  const local = (execution: HandlerExecution) => {
    if (execution.projectId === projectId && execution.handlerId === handlerId) {
      listener(execution);
    }
  };
  localListeners.add(local);

  const broadcast = (event: MessageEvent<HandlerExecution>) => {
    const execution = event.data;
    if (execution?.projectId === projectId && execution.handlerId === handlerId) {
      listener(execution);
    }
  };
  getChannel()?.addEventListener("message", broadcast);

  return () => {
    localListeners.delete(local);
    getChannel()?.removeEventListener("message", broadcast);
  };
}

function storageKey(projectId: string, handlerId: string): string {
  return `${STORAGE_PREFIX}${encodeURIComponent(projectId)}.${encodeURIComponent(handlerId)}`;
}

function makeSerializable(execution: HandlerExecution): HandlerExecution {
  try {
    return structuredClone(execution);
  } catch {
    return JSON.parse(JSON.stringify(execution, (_key, value) => {
      if (typeof value === "function") return `[Function ${value.name || "anonymous"}]`;
      if (typeof value === "bigint") return String(value);
      return value;
    })) as HandlerExecution;
  }
}
