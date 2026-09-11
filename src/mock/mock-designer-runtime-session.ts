import type { ProjectData } from "../uiframework/data/tags/TagDefinition";
import { attachDesignerTagRuntime } from "../uiframework/data/tags/designer-tag-store";
import {
  configureMockRuntimeProjectData,
  getMockRuntimeSession,
} from "./mock-tag-runtime";
import { ensureMockTagRuntimeBridge } from "./mock-runtime-socket";

/**
 * Designer adapter for the local mock runtime. Designer, handlers, UDT methods
 * and drivers share the same project-scoped TagRuntime / TagStore.
 */
export function connectMockDesignerRuntimeSession(
  projectId: string,
  data: ProjectData
) {
  const session = getMockRuntimeSession(projectId, data);
  configureMockRuntimeProjectData(projectId, data);
  ensureMockTagRuntimeBridge(projectId, data);
  attachDesignerTagRuntime(session.tags);
}
