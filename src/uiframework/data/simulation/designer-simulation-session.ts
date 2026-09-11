import type { SimulationDriverDiagnostic } from "./SimulationDriver";
import type { ProjectData } from "../tags/TagDefinition";

export type DesignerSimulationSnapshot = {
  running: boolean;
  diagnostics: SimulationDriverDiagnostic[];
};

/**
 * UI-side lifecycle state only. The actual SimulationDriver runs in the same
 * project-scoped mock runtime as script handlers, so there is a single
 * canonical TagStore for script writes and generated values.
 */
class DesignerSimulationSession {
  private readonly listeners = new Set<() => void>();
  private snapshot: DesignerSimulationSnapshot = { running: false, diagnostics: [] };

  configure(data: ProjectData) {
    void data;
  }

  start(data: ProjectData) {
    void data;
    if (this.snapshot.running) return;
    this.snapshot = { running: true, diagnostics: [] };
    this.emit();
  }

  stop() {
    if (!this.snapshot.running) return;
    this.snapshot = { running: false, diagnostics: [] };
    this.emit();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot() {
    return this.snapshot;
  }

  private emit() {
    for (const listener of this.listeners) listener();
  }
}

export const designerSimulationSession = new DesignerSimulationSession();
