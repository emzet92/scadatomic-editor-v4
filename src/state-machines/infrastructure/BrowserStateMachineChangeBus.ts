import type { StateMachineChangeBus, StateMachineLibraryEvent } from "../application/StateMachineChangeBus";

const CHANNEL = "scadatomic.state-machines.v1";

export class BrowserStateMachineChangeBus implements StateMachineChangeBus {
  private readonly listeners = new Set<(event: StateMachineLibraryEvent) => void>();
  private readonly channel: BroadcastChannel | null;

  constructor() {
    this.channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(CHANNEL);
    this.channel?.addEventListener("message", this.onMessage);
  }

  publish(event: StateMachineLibraryEvent): void { this.channel?.postMessage(event); }
  subscribe(listener: (event: StateMachineLibraryEvent) => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  dispose(): void { this.channel?.removeEventListener("message", this.onMessage); this.channel?.close(); this.listeners.clear(); }

  private readonly onMessage = (event: MessageEvent<unknown>) => {
    if (isEvent(event.data)) for (const listener of this.listeners) listener(event.data);
  };
}

function isEvent(value: unknown): value is StateMachineLibraryEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<StateMachineLibraryEvent>;
  return (event.kind === "saved" || event.kind === "deleted") && typeof event.projectId === "string" && typeof event.machineId === "string";
}
