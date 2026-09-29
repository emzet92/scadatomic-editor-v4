import type {
  ProcessChangeBus,
  ProcessLibraryEvent,
} from "../application/ProcessChangeBus";

const CHANNEL_NAME = "scadatomic.processes.v1";
const STORAGE_EVENT_KEY = "scadatomic.processes.change.v1";

/**
 * Browser invalidation bus used to keep Designer/Animator/Runtime tabs in sync.
 * BroadcastChannel is preferred; localStorage is only a signalling fallback.
 */
export class BrowserProcessChangeBus implements ProcessChangeBus {
  private readonly listeners = new Set<(event: ProcessLibraryEvent) => void>();
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
      this.channel.addEventListener("message", this.handleBroadcastMessage);
      this.storageListener = null;
      return;
    }

    this.channel = null;
    this.storageListener = (event) => {
      if (event.key !== STORAGE_EVENT_KEY || !event.newValue) return;
      try {
        const payload = JSON.parse(event.newValue) as unknown;
        if (isProcessLibraryEvent(payload)) this.emit(payload);
      } catch {
        // Malformed foreign storage events are ignored deliberately.
      }
    };
    window.addEventListener("storage", this.storageListener);
  }

  publish(event: ProcessLibraryEvent): void {
    if (this.channel) {
      this.channel.postMessage(event);
      return;
    }

    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_EVENT_KEY,
        JSON.stringify({ ...event, nonce: crypto.randomUUID() }),
      );
    } catch {
      // Persistence is IndexedDB. Losing an invalidation signal must not make
      // saving fail (private browsing/storage policy can disable localStorage).
    }
  }

  subscribe(listener: (event: ProcessLibraryEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispose(): void {
    this.listeners.clear();
    if (this.channel) {
      this.channel.removeEventListener("message", this.handleBroadcastMessage);
      this.channel.close();
    }
    if (this.storageListener && typeof window !== "undefined") {
      window.removeEventListener("storage", this.storageListener);
    }
  }

  private readonly handleBroadcastMessage = (message: MessageEvent<unknown>) => {
    if (isProcessLibraryEvent(message.data)) this.emit(message.data);
  };

  private emit(event: ProcessLibraryEvent) {
    for (const listener of this.listeners) listener(event);
  }
}

function isProcessLibraryEvent(value: unknown): value is ProcessLibraryEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<ProcessLibraryEvent>;
  return (
    (event.kind === "saved" || event.kind === "deleted") &&
    typeof event.projectId === "string" &&
    typeof event.processId === "string" &&
    typeof event.updatedAt === "number"
  );
}
