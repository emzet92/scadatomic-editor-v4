import type { ProjectData } from "../uiframework/data/tags/TagDefinition";
import { attachDesignerTagStore } from "../uiframework/data/tags/designer-tag-store";
import {
  configureMockRuntimeProjectData,
  getMockRuntimeSession,
} from "./mock-tag-runtime";
import { ensureMockTagRuntimeBridge } from "./mock-runtime-socket";

/**
 * Designer adapter for the local mock runtime. There is no value mirror here:
 * Designer controls subscribe to the exact same TagStore used by handlers and
 * drivers for this project runtime session.
 */
export function connectMockDesignerRuntimeSession(
  projectId: string,
  data: ProjectData
) {
  const session = getMockRuntimeSession(projectId, data);
  configureMockRuntimeProjectData(projectId, data);
  ensureMockTagRuntimeBridge(projectId, data);
  attachDesignerTagStore(session.tagStore);

}
