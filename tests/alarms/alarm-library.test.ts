import assert from "node:assert/strict";
import { test } from "node:test";
import type { AlarmLibraryEvent } from "../../src/alarms/application/AlarmChangeBus";
import type { AlarmChangeBus } from "../../src/alarms/application/AlarmChangeBus";
import { AlarmLibrary } from "../../src/alarms/application/AlarmLibrary";
import type { AlarmDefinitionRepository, AlarmEventRepository, AlarmStateRepository } from "../../src/alarms/application/AlarmPorts";
import { createAlarmDefinition, type AlarmDefinition, type AlarmDefinitionSummary } from "../../src/alarms/domain/alarm-definition";
import type { AlarmEvent } from "../../src/alarms/domain/alarm-event";
import type { AlarmInstance } from "../../src/alarms/domain/alarm-instance";

class MemoryRepository implements AlarmDefinitionRepository, AlarmEventRepository, AlarmStateRepository {
  definitions = new Map<string, AlarmDefinition>();
  events: AlarmEvent[] = [];
  states = new Map<string, AlarmInstance>();
  async list(projectId: string): Promise<AlarmDefinitionSummary[]> { return [...this.definitions.values()].filter((item) => item.projectId === projectId); }
  async get(id: string) { return this.definitions.get(id) ?? null; }
  async put(value: AlarmDefinition) { this.definitions.set(value.id, structuredClone(value)); }
  async delete(id: string) { this.definitions.delete(id); }
  async append(event: AlarmEvent) { this.events.push(structuredClone(event)); }
  async listEvents(projectId: string) { return this.events.filter((event) => event.projectId === projectId); }
  async getState(projectId: string, alarmId: string) { return this.states.get(`${projectId}:${alarmId}`) ?? null; }
  async putState(instance: AlarmInstance) { this.states.set(`${instance.projectId}:${instance.alarmId}`, structuredClone(instance)); }
  async deleteState(projectId: string, alarmId: string) { this.states.delete(`${projectId}:${alarmId}`); }
}

class FakeBus implements AlarmChangeBus {
  published: AlarmLibraryEvent[] = [];
  listeners = new Set<(event: AlarmLibraryEvent) => void>();
  publish(event: AlarmLibraryEvent) { this.published.push(event); }
  subscribe(listener: (event: AlarmLibraryEvent) => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  dispose() { this.listeners.clear(); }
}

test("saving an alarm overwrites the same aggregate id and publishes after persistence", async () => {
  const repository = new MemoryRepository();
  const bus = new FakeBus();
  const library = new AlarmLibrary(repository, repository, repository, bus);
  const alarm = createAlarmDefinition({ projectId: "demo", source: { kind: "tag", path: "T" }, condition: { kind: "boolean", activeWhen: true } });
  const saved = await library.save(alarm);
  await library.save({ ...saved, message: "updated" });
  assert.equal(repository.definitions.size, 1);
  assert.equal((await library.get(saved.id))?.message, "updated");
  assert.equal(bus.published.filter((event) => event.kind === "saved").length, 2);
  library.dispose();
});
