import type { AlarmChangeBus, AlarmLibraryEvent } from "../application/AlarmChangeBus";

const CHANNEL_NAME = "scadatomic.alarms.v1";
const STORAGE_EVENT_KEY = "scadatomic.alarms.change.v1";

export class BrowserAlarmChangeBus implements AlarmChangeBus {
  private readonly listeners = new Set<(event: AlarmLibraryEvent) => void>();
  private readonly channel: BroadcastChannel | null;
  private readonly storageListener: ((event: StorageEvent) => void) | null;

  constructor() {
    if (typeof window === "undefined") {
      this.channel = null;
      this.storageListener = null;
      return;
    }
    if (typeof BroadcastChannel !== "undefined") {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.addEventListener("message", this.handleMessage);
      this.storageListener = null;
    } else {
      this.channel = null;
      this.storageListener = (event) => {
        if (event.key !== STORAGE_EVENT_KEY || !event.newValue) return;
        try {
          const parsed = JSON.parse(event.newValue) as unknown;
          if (isAlarmLibraryEvent(parsed)) this.emit(parsed);
        } catch {
          // Foreign/malformed storage messages are ignored.
        }
      };
      window.addEventListener("storage", this.storageListener);
    }
  }

  publish(event: AlarmLibraryEvent): void {
    if (this.channel) {
      this.channel.postMessage(event);
      return;
    }
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_EVENT_KEY, JSON.stringify({ ...event, nonce: crypto.randomUUID() }));
    } catch {
      // IndexedDB is authoritative; invalidation signalling is best effort.
    }
  }

  subscribe(listener: (event: AlarmLibraryEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispose(): void {
    this.listeners.clear();
    if (this.channel) {
      this.channel.removeEventListener("message", this.handleMessage);
      this.channel.close();
    }
    if (this.storageListener && typeof window !== "undefined") window.removeEventListener("storage", this.storageListener);
  }

  private readonly handleMessage = (message: MessageEvent<unknown>) => {
    if (isAlarmLibraryEvent(message.data)) this.emit(message.data);
  };

  private emit(event: AlarmLibraryEvent) {
    for (const listener of this.listeners) listener(event);
  }
}

function isAlarmLibraryEvent(value: unknown): value is AlarmLibraryEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<AlarmLibraryEvent>;
  return typeof event.projectId === "string" && typeof event.alarmId === "string" && typeof event.updatedAt === "number" &&
    (event.kind === "saved" || event.kind === "deleted" || event.kind === "event" || event.kind === "state");
}
