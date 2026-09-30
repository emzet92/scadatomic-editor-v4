type ChangeKind = "config" | "sample";
type Listener = () => void;

type HistorianChangeMessage = {
  projectId: string;
  kind: ChangeKind;
};

export class HistorianChangeBus {
  private readonly listeners = new Map<string, Set<Listener>>();
  private readonly channel = typeof BroadcastChannel === "undefined"
    ? undefined
    : new BroadcastChannel("scadatomic-historian");

  constructor() {
    this.channel?.addEventListener("message", (event: MessageEvent<HistorianChangeMessage>) => {
      const payload = event.data;
      if (!payload?.projectId || !payload.kind) return;
      this.notify(payload.projectId, payload.kind);
    });
  }

  publish(projectId: string, kind: ChangeKind) {
    this.notify(projectId, kind);
    this.channel?.postMessage({ projectId, kind } satisfies HistorianChangeMessage);
  }

  subscribe(projectId: string, kind: ChangeKind, listener: Listener) {
    const key = `${kind}:${projectId}`;
    const listeners = this.listeners.get(key) ?? new Set<Listener>();
    listeners.add(listener);
    this.listeners.set(key, listeners);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) this.listeners.delete(key);
    };
  }

  private notify(projectId: string, kind: ChangeKind) {
    for (const listener of this.listeners.get(`${kind}:${projectId}`) ?? []) listener();
  }
}

export const historianChangeBus = new HistorianChangeBus();
