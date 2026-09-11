import { DriverRuntime } from "../drivers/DriverRuntime";
import type { TagDriverRegistry } from "../drivers/DriverRegistry";
import type { ProjectData } from "../tags/TagDefinition";
import { TagStore } from "../tags/TagStore";
import { TagRuntime } from "./TagRuntime";

/**
 * Runtime ownership boundary for one running project.
 *
 * ProjectData is configuration/initial state. TagStore is the single live
 * process image. Application writes go through TagRuntime -> DriverRuntime;
 * only source drivers publish readback into TagStore.
 */
export class ProjectRuntimeSession {
  readonly projectId: string;
  readonly tagStore: TagStore;
  readonly drivers: DriverRuntime;
  readonly tags: TagRuntime;

  private projectData: ProjectData;

  constructor(projectId: string, data: ProjectData, driverRegistry: TagDriverRegistry) {
    this.projectId = projectId;
    this.projectData = structuredClone(data);
    this.tagStore = new TagStore(data);
    this.drivers = new DriverRuntime(driverRegistry, {
      tagStore: this.tagStore,
      getProjectData: () => this.projectData,
    });
    this.tags = new TagRuntime(this.tagStore, this.drivers);
  }

  getProjectData() {
    return this.projectData;
  }

  configure(data: ProjectData) {
    this.projectData = structuredClone(data);
    this.tagStore.reconfigure(data);
    this.drivers.configure();
  }

  reset(data: ProjectData) {
    this.projectData = structuredClone(data);
    this.tagStore.replaceData(data);
    this.drivers.configure();
  }

  dispose() {
    this.drivers.dispose();
  }
}
