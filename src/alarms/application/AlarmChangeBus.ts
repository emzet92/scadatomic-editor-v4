export type AlarmLibraryEvent = {
  projectId: string;
  alarmId: string;
  kind: "saved" | "deleted" | "event" | "state";
  updatedAt: number;
};

export interface AlarmChangeBus {
  publish(event: AlarmLibraryEvent): void;
  subscribe(listener: (event: AlarmLibraryEvent) => void): () => void;
  dispose(): void;
}
