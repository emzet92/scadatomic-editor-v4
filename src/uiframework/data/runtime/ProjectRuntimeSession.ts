import type { ProjectData } from "../tags/TagDefinition";
import { TagStore } from "../tags/TagStore";

/**
 * Runtime ownership boundary for one running project.
 *
 * ProjectData is configuration/initial state. TagStore is the single live
 * value store. Reconfiguration updates definitions without resetting values;
 * reset is reserved for explicit runtime boundaries such as publish/reload.
 */
export class ProjectRuntimeSession {
  readonly projectId: string;
  readonly tagStore: TagStore;

  private projectData: ProjectData;

  constructor(projectId: string, data: ProjectData) {
    this.projectId = projectId;
    this.projectData = structuredClone(data);
    this.tagStore = new TagStore(data);
  }

  getProjectData() {
    return this.projectData;
  }

  configure(data: ProjectData) {
    this.projectData = structuredClone(data);
    this.tagStore.reconfigure(data);
  }

  reset(data: ProjectData) {
    this.projectData = structuredClone(data);
    this.tagStore.replaceData(data);
  }
}
