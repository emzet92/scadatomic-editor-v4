import assert from "node:assert/strict";
import { test } from "node:test";
import type { ProcessChangeBus, ProcessLibraryEvent } from "../../src/processes/application/ProcessChangeBus";
import { ProcessLibrary } from "../../src/processes/application/ProcessLibrary";
import type { ProcessRepository } from "../../src/processes/application/ProcessRepository";
import { createProcessDefinition, type ProcessDefinition, type ProcessSummary } from "../../src/processes/domain/process-definition";

function definition(id: string, name: string): ProcessDefinition {
  return createProcessDefinition({
    id,
    projectId: "demo",
    name,
    path: { id: `${id}-path`, name, points: [] },
    scene: { zones: [], sensors: [] },
    playback: { durationSeconds: 1, loopMode: "loop" },
    bindings: {},
  });
}

class MemoryRepository implements ProcessRepository {
  readonly values = new Map<string, ProcessDefinition>();

  async list(projectId: string): Promise<ProcessSummary[]> {
    return [...this.values.values()]
      .filter((value) => value.projectId === projectId)
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map(({ id, projectId: ownerProjectId, name, updatedAt }) => ({
        id,
        projectId: ownerProjectId,
        name,
        updatedAt,
      }));
  }

  async get(processId: string): Promise<ProcessDefinition | null> {
    return this.values.get(processId) ?? null;
  }

  async put(value: ProcessDefinition): Promise<void> {
    this.values.set(value.id, structuredClone(value));
  }

  async delete(processId: string): Promise<void> {
    this.values.delete(processId);
  }
}

class FakeChangeBus implements ProcessChangeBus {
  readonly published: ProcessLibraryEvent[] = [];
  private readonly listeners = new Set<(event: ProcessLibraryEvent) => void>();

  publish(event: ProcessLibraryEvent): void {
    this.published.push(event);
  }

  subscribe(listener: (event: ProcessLibraryEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emitExternal(event: ProcessLibraryEvent): void {
    for (const listener of this.listeners) listener(event);
  }

  dispose(): void {
    this.listeners.clear();
  }
}

test("saving the same process id overwrites one aggregate instead of creating a duplicate", async () => {
  const repository = new MemoryRepository();
  const library = new ProcessLibrary(repository);

  const first = await library.save(definition("process-a", "First"));
  await library.save({ ...first, name: "Updated" });

  assert.equal(repository.values.size, 1);
  assert.equal((await library.get("process-a"))?.name, "Updated");
  library.dispose();
});

test("save notifications are published only after persistence completes", async () => {
  let releasePut!: () => void;
  const putFinished = new Promise<void>((resolve) => { releasePut = resolve; });
  const repository: ProcessRepository = {
    async list() { return []; },
    async get() { return null; },
    async put() { await putFinished; },
    async delete() {},
  };
  const bus = new FakeChangeBus();
  const library = new ProcessLibrary(repository, bus);

  const savePromise = library.save(definition("process-a", "Deferred"));
  await Promise.resolve();
  assert.equal(bus.published.length, 0);

  releasePut();
  await savePromise;
  assert.equal(bus.published.length, 1);
  assert.equal(bus.published[0]?.processId, "process-a");
  library.dispose();
});

test("external change-bus invalidation is forwarded to library subscribers", () => {
  const repository = new MemoryRepository();
  const bus = new FakeChangeBus();
  const library = new ProcessLibrary(repository, bus);
  const received: ProcessLibraryEvent[] = [];
  library.subscribe((event) => received.push(event));

  bus.emitExternal({
    projectId: "demo",
    processId: "process-a",
    kind: "saved",
    updatedAt: 123,
  });

  assert.deepEqual(received, [{
    projectId: "demo",
    processId: "process-a",
    kind: "saved",
    updatedAt: 123,
  }]);
  library.dispose();
});
