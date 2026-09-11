import type { ProjectData } from "../uiframework/data/tags/TagDefinition";
import { createEmptyProjectData } from "../uiframework/data/tags/TagDefinition";
import {
  configureMockRuntimeProjectData,
  getMockRuntimeSession,
} from "./mock-tag-runtime";

/** Mock transport adapter over the production-shaped DriverRuntime in the project session. */
export class MockDriverRuntime {
  configure(
    projectId: string,
    driverKind: string,
    data: ProjectData | undefined
  ) {
    const resolvedData = data ?? createEmptyProjectData();
    const session = configureMockRuntimeProjectData(projectId, resolvedData);
    session.drivers.configure();
    return session.drivers.get(driverKind);
  }

  configureExisting(projectId: string, data: ProjectData | undefined) {
    const session = configureMockRuntimeProjectData(
      projectId,
      data ?? createEmptyProjectData()
    );
    session.drivers.configure();
  }

  start(projectId: string, driverKind: string, data?: ProjectData) {
    const resolvedData = data ?? createEmptyProjectData();
    const session = configureMockRuntimeProjectData(projectId, resolvedData);
    return session.drivers.start(driverKind);
  }

  stop(projectId: string, driverKind: string) {
    getMockRuntimeSession(projectId).drivers.stop(driverKind);
  }

  isRunning(projectId: string, driverKind: string) {
    return getMockRuntimeSession(projectId).drivers.isRunning(driverKind);
  }

  disposeProject(projectId: string) {
    getMockRuntimeSession(projectId).drivers.dispose();
  }

  dispose() {
    // Project sessions own driver lifecycles; disposing all sessions is handled
    // by their owning runtime boundary.
  }
}
