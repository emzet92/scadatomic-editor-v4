import test from "node:test";
import assert from "node:assert/strict";
import { StateMachineLibrary } from "../../src/state-machines/application/StateMachineLibrary";
import type { StateMachineChangeBus, StateMachineLibraryEvent } from "../../src/state-machines/application/StateMachineChangeBus";
import type { StateMachineRepository } from "../../src/state-machines/application/StateMachineRepository";
import type { StateMachineDefinition, StateMachineSummary } from "../../src/state-machines/domain/state-machine-definition";
import { defineStateMachine, state } from "../../src/state-machines/application/js-api";

class MemoryRepository implements StateMachineRepository {
  readonly values = new Map<string, StateMachineDefinition>();
  persisted = false;
  async list(projectId: string): Promise<StateMachineSummary[]> {
    return [...this.values.values()].filter((item) => item.projectId === projectId).map(({ id, projectId: owner, name, updatedAt }) => ({ id, projectId: owner, name, updatedAt }));
  }
  async get(machineId: string) { return structuredClone(this.values.get(machineId) ?? null); }
  async put(definition: StateMachineDefinition) { this.values.set(definition.id, structuredClone(definition)); this.persisted = true; }
  async delete(machineId: string) { this.values.delete(machineId); }
}

class MemoryBus implements StateMachineChangeBus {
  readonly published: StateMachineLibraryEvent[] = [];
  readonly listeners = new Set<(event: StateMachineLibraryEvent) => void>();
  constructor(private readonly repository: MemoryRepository) {}
  publish(event: StateMachineLibraryEvent) {
    assert.equal(this.repository.persisted, true, "publish must happen after persistence");
    this.published.push(event);
  }
  subscribe(listener: (event: StateMachineLibraryEvent) => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  dispose() { this.listeners.clear(); }
}

function machine(name: string) {
  return defineStateMachine({ id: "machine-1", projectId: "demo", name, initial: "idle", states: [state("idle")] });
}

test("saving same machine id overwrites one aggregate and publishes after persistence", async () => {
  const repository = new MemoryRepository();
  const bus = new MemoryBus(repository);
  const library = new StateMachineLibrary(repository, bus);
  await library.save(machine("First"));
  repository.persisted = false;
  await library.save(machine("Second"));
  assert.equal(repository.values.size, 1);
  assert.equal((await library.get("machine-1"))?.name, "Second");
  assert.equal(bus.published.length, 2);
});
