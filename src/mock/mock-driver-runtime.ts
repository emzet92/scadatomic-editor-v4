import type { ProjectData } from "../uiframework/data/tags/TagDefinition";
import { createEmptyProjectData } from "../uiframework/data/tags/TagDefinition";
import type { TagDriver } from "../uiframework/data/drivers/TagDriver";
import { createDefaultTagDriverRegistry } from "../uiframework/data/simulation/default-driver-registry";
import { getMockTagStore, replaceMockTagStoreData } from "./mock-tag-runtime";

type DriverEntry = {
  data: ProjectData;
  driver: TagDriver;
};

export class MockDriverRuntime {
  private readonly entries = new Map<string, Map<string, DriverEntry>>();
  private readonly drivers = createDefaultTagDriverRegistry();

  configure(
    projectId: string,
    driverKind: string,
    data: ProjectData | undefined,
    replaceStore = true
  ) {
    const resolvedData = data ?? createEmptyProjectData();
    const store = replaceStore
      ? replaceMockTagStoreData(projectId, resolvedData)
      : getMockTagStore(projectId, resolvedData);
    const projectEntries = this.entries.get(projectId) ?? new Map<string, DriverEntry>();
    this.entries.set(projectId, projectEntries);

    const current = projectEntries.get(driverKind);
    if (current) {
      current.data = resolvedData;
      return current;
    }

    const driver = this.drivers.create(driverKind, {
      tagStore: store,
      getProjectData: () => projectEntries.get(driverKind)?.data ?? resolvedData,
    });
    const entry: DriverEntry = { data: resolvedData, driver };
    projectEntries.set(driverKind, entry);
    return entry;
  }

  configureExisting(projectId: string, data: ProjectData | undefined) {
    const projectEntries = this.entries.get(projectId);
    if (!projectEntries) return;
    const resolvedData = data ?? createEmptyProjectData();
    for (const entry of projectEntries.values()) entry.data = resolvedData;
  }

  start(projectId: string, driverKind: string, data?: ProjectData) {
    // The project-scoped TagStore may already contain handler/session writes.
    // Starting a driver must never replace that live runtime state with the
    // persisted ProjectData snapshot.
    const entry = this.configure(projectId, driverKind, data, false);
    entry.driver.start();
    return entry.driver;
  }

  stop(projectId: string, driverKind: string) {
    this.entries.get(projectId)?.get(driverKind)?.driver.stop();
  }

  isRunning(projectId: string, driverKind: string) {
    return this.entries.get(projectId)?.get(driverKind)?.driver.isRunning() ?? false;
  }

  dispose() {
    for (const projectEntries of this.entries.values()) {
      for (const entry of projectEntries.values()) entry.driver.dispose();
    }
    this.entries.clear();
  }
}
