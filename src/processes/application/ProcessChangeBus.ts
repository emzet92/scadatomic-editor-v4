export type ProcessLibraryEvent = {
  projectId: string;
  processId: string;
  kind: "saved" | "deleted";
  updatedAt: number;
};

/**
 * Cross-context notification port for process-definition changes.
 * Persistence remains the source of truth; the bus only invalidates readers.
 */
export interface ProcessChangeBus {
  publish(event: ProcessLibraryEvent): void;
  subscribe(listener: (event: ProcessLibraryEvent) => void): () => void;
  dispose(): void;
}
