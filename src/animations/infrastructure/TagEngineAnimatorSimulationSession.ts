import type { ProcessTagSource } from "../../processes";
import type { ProjectData } from "../../tags/model/TagDefinition";
import { ProjectRuntimeSession } from "../../tags/runtime/ProjectRuntimeSession";
import { createDefaultTagDriverRegistry } from "../../tags/simulation/default-driver-registry";

export type AnimatorSimulationWriteResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Animation-workspace adapter around the tag engine.
 *
 * Every animator owns a private ProjectRuntimeSession. Project SimulationDriver
 * generators may be started inside that private session, while manual preview
 * controls write directly to its private TagStore. Neither operation can mutate
 * the rendered runtime or the Designer's simulator session.
 */
export class TagEngineAnimatorSimulationSession implements ProcessTagSource {
  readonly id: string;
  private readonly runtime: ProjectRuntimeSession;
  private readonly initialValues = new Map<string, unknown>();
  private running = false;

  constructor(projectId: string, data: ProjectData) {
    this.id = `animator:${projectId}:${crypto.randomUUID()}`;
    this.runtime = new ProjectRuntimeSession(
      this.id,
      structuredClone(data),
      createDefaultTagDriverRegistry(),
    );
    for (const resolved of this.runtime.tagStore.listPrimitivePaths()) {
      this.initialValues.set(resolved.path, structuredClone(resolved.value));
    }
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

  restart(): void {
    this.stop();
    this.resetValues();
    this.start();
  }

  resetValues(): void {
    this.stop();
    for (const [path, value] of this.initialValues) {
      this.runtime.tagStore.set(path, structuredClone(value), {
        source: { kind: "session", id: this.id },
      });
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  read(path: string): unknown {
    return this.runtime.tagStore.get(path);
  }

  write(path: string, value: unknown): AnimatorSimulationWriteResult {
    const result = this.runtime.tagStore.set(path, value, {
      source: { kind: "session", id: this.id },
    });
    return result.ok ? { ok: true } : { ok: false, error: result.error };
  }

  subscribe(path: string, listener: () => void): () => void {
    return this.runtime.tagStore.subscribe(path, listener);
  }

  dispose(): void {
    this.running = false;
    this.runtime.dispose();
  }
}
