export type StateMachineLibraryEvent = {
  projectId: string;
  machineId: string;
  kind: "saved" | "deleted";
  updatedAt: number;
};

export interface StateMachineChangeBus {
  publish(event: StateMachineLibraryEvent): void;
  subscribe(listener: (event: StateMachineLibraryEvent) => void): () => void;
  dispose(): void;
}
