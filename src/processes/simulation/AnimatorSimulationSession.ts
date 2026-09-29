import type { ProjectData } from "../../tags/model/TagDefinition";
import { ProjectRuntimeSession } from "../../tags/runtime/ProjectRuntimeSession";
import { createDefaultTagDriverRegistry } from "../../tags/simulation/default-driver-registry";
import type { ProcessTagSource } from "../application/ProcessTagSource";

/**
 * Dedicated simulation boundary for the process animator.
 *
 * Every instance owns its own ProjectRuntimeSession/TagStore/SimulationDriver.
 * It never reaches the designer runtime singleton or the rendered runtime
 * session, so testing an animation cannot mutate live runtime values.
 */
export class AnimatorSimulationSession implements ProcessTagSource {
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

  start() {
    if (this.running) return;
    this.runtime.drivers.start("simulation");
    this.running = true;
  }

  stop() {
    if (!this.running) return;
    this.runtime.drivers.stop("simulation");
    this.running = false;
  }

  isRunning() {
    return this.running;
  }

  read(path: string): unknown {
    return this.runtime.tagStore.get(path);
  }

  subscribe(path: string, listener: () => void): () => void {
    return this.runtime.tagStore.subscribe(path, listener);
  }

  dispose() {
    this.running = false;
    this.runtime.dispose();
  }
}
