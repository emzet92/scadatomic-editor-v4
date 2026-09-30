import type { ProcessTagSource } from "../../processes";
import type { ProjectData } from "../../tags/model/TagDefinition";
import { ProjectRuntimeSession } from "../../tags/runtime/ProjectRuntimeSession";
import { createDefaultTagDriverRegistry } from "../../tags/simulation/default-driver-registry";

/**
 * Animation-workspace adapter around the tag engine.
 *
 * The generic process bounded context knows only ProcessTagSource. This concrete
 * adapter deliberately lives in `animations`, because it integrates process
 * preview with the editor's tag/simulator implementation.
 */
export class TagEngineAnimatorSimulationSession implements ProcessTagSource {
  readonly id: string;
  private readonly runtime: ProjectRuntimeSession;
  private running = false;

  constructor(projectId: string, data: ProjectData) {
    this.id = `animator:${projectId}:${crypto.randomUUID()}`;
    this.runtime = new ProjectRuntimeSession(
      this.id,
      structuredClone(data),
      createDefaultTagDriverRegistry(),
    );
  }

  start(): void {
    if (this.running) return;
    this.runtime.drivers.start("simulation");
    this.running = true;
  }

  stop(): void {
    if (!this.running) return;
    this.runtime.drivers.stop("simulation");
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  read(path: string): unknown {
    return this.runtime.tagStore.get(path);
  }

  subscribe(path: string, listener: () => void): () => void {
    return this.runtime.tagStore.subscribe(path, listener);
  }

  dispose(): void {
    this.running = false;
    this.runtime.dispose();
  }
}
