import type { ProjectData } from "../uiframework/data/tags/TagDefinition";
import { createEmptyProjectData } from "../uiframework/data/tags/TagDefinition";
import type { TagDriver } from "../uiframework/data/drivers/TagDriver";
import { createDefaultTagDriverRegistry } from "../uiframework/data/simulation/default-driver-registry";
import { getMockTagStore, replaceMockTagStoreData } from "./mock-tag-runtime";

type MockSimulationEntry = {
  data: ProjectData;
  driver: TagDriver;
};

export class MockSimulationRuntime {
  private readonly entries = new Map<string, MockSimulationEntry>();
  private readonly drivers = createDefaultTagDriverRegistry();

  configure(projectId: string, data: ProjectData | undefined, replaceStore = true) {
    const resolvedData = data ?? createEmptyProjectData();
    const store = replaceStore
      ? replaceMockTagStoreData(projectId, resolvedData)
      : getMockTagStore(projectId, resolvedData);
    const current = this.entries.get(projectId);
    if (current) {
      current.data = resolvedData;
      return current;
    }

    const driver = this.drivers.create("simulation", {
      tagStore: store,
      getProjectData: () => this.entries.get(projectId)?.data ?? resolvedData,
    });
    const entry: MockSimulationEntry = { data: resolvedData, driver };
    this.entries.set(projectId, entry);
    return entry;
  }

  start(projectId: string, data?: ProjectData) {
    const entry = this.configure(projectId, data, data !== undefined);
    entry.driver.start();
    return entry.driver;
  }

  stop(projectId: string) {
    this.entries.get(projectId)?.driver.stop();
  }

  isRunning(projectId: string) {
    return this.entries.get(projectId)?.driver.isRunning() ?? false;
  }

  dispose() {
    for (const entry of this.entries.values()) entry.driver.dispose();
    this.entries.clear();
  }
}
