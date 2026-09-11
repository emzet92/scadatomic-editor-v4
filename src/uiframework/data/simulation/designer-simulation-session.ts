import type { ProjectData } from "../tags/TagDefinition";
import { designerTagStore } from "../tags/designer-tag-store";
import {
  SimulationDriver,
  type SimulationDriverDiagnostic,
} from "./SimulationDriver";

export type DesignerSimulationSnapshot = {
  running: boolean;
  diagnostics: SimulationDriverDiagnostic[];
};

class DesignerSimulationSession {
  private data: ProjectData = { udts: {}, tags: {} };
  private readonly listeners = new Set<() => void>();
  private snapshot: DesignerSimulationSnapshot = { running: false, diagnostics: [] };
  private readonly driver = new SimulationDriver(
    {
      tagStore: designerTagStore,
      getProjectData: () => this.data,
    },
    {
      onDiagnosticsChanged: (diagnostics) => {
        this.snapshot = { ...this.snapshot, diagnostics };
        this.emit();
      },
    }
  );

  configure(data: ProjectData) {
    this.data = data;
  }

  start(data: ProjectData) {
    this.configure(data);
    this.driver.start();
    if (!this.snapshot.running) {
      this.snapshot = { ...this.snapshot, running: true };
      this.emit();
    }
  }

  stop() {
    this.driver.stop();
    if (this.snapshot.running || this.snapshot.diagnostics.length > 0) {
      this.snapshot = { running: false, diagnostics: [] };
      this.emit();
    }
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
