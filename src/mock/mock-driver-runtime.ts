import type { ProjectData } from "../uiframework/data/tags/TagDefinition";
import { createEmptyProjectData } from "../uiframework/data/tags/TagDefinition";
import type { TagDriver } from "../uiframework/data/drivers/TagDriver";
import { createDefaultTagDriverRegistry } from "../uiframework/data/simulation/default-driver-registry";
import {
  configureMockRuntimeProjectData,
  getMockRuntimeSession,
} from "./mock-tag-runtime";

type DriverEntry = {
  driver: TagDriver;
};

export class MockDriverRuntime {
  private readonly entries = new Map<string, Map<string, DriverEntry>>();
  private readonly drivers = createDefaultTagDriverRegistry();

  configure(
    projectId: string,
    driverKind: string,
    data: ProjectData | undefined
  ) {
    const resolvedData = data ?? createEmptyProjectData();
    const session = configureMockRuntimeProjectData(projectId, resolvedData);
    const projectEntries = this.entries.get(projectId) ?? new Map<string, DriverEntry>();
    this.entries.set(projectId, projectEntries);

    const current = projectEntries.get(driverKind);
    if (current) {
      current.driver.configure?.();
      return current;
    }

    const driver = this.drivers.create(driverKind, {
      tagStore: session.tagStore,
      getProjectData: () => getMockRuntimeSession(projectId).getProjectData(),
    });
    const entry: DriverEntry = { driver };
    projectEntries.set(driverKind, entry);
    return entry;
  }

  configureExisting(projectId: string, data: ProjectData | undefined) {
    configureMockRuntimeProjectData(projectId, data ?? createEmptyProjectData());
    for (const entry of this.entries.get(projectId)?.values() ?? []) {
      entry.driver.configure?.();
    }
  }

  start(projectId: string, driverKind: string, data?: ProjectData) {
    const entry = this.configure(projectId, driverKind, data);
    entry.driver.start();
    return entry.driver;
  }

  stop(projectId: string, driverKind: string) {
    this.entries.get(projectId)?.get(driverKind)?.driver.stop();
  }

  isRunning(projectId: string, driverKind: string) {
    return this.entries.get(projectId)?.get(driverKind)?.driver.isRunning() ?? false;
  }

  disposeProject(projectId: string) {
    const entries = this.entries.get(projectId);
    if (!entries) return;
    for (const entry of entries.values()) entry.driver.dispose();
    this.entries.delete(projectId);
  }

  dispose() {
    for (const projectEntries of this.entries.values()) {
      for (const entry of projectEntries.values()) entry.driver.dispose();
    }
    this.entries.clear();
  }
}
