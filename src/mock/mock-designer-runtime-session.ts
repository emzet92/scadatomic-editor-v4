import type { ProjectData } from "../uiframework/data/tags/TagDefinition";
import { attachDesignerTagRuntime } from "../uiframework/data/tags/designer-tag-store";
import {
  configureMockRuntimeProjectData,
} from "./mock-tag-runtime";
import {
  ensureMockTagRuntimeBridge,
  getMockTransportTagRuntime,
} from "./mock-runtime-socket";
import {
  claimMockRuntimeAuthority,
  isMockRuntimeAuthority,
} from "./mock-runtime-authority";

/**
 * Designer adapter for the local mock runtime.
 *
 * The first live project tab claims the single I/O authority. Its TagStore and
 * drivers are canonical. Any additional tab attaches a client TagRuntime whose
 * writes are forwarded to the authority and whose store is only a readback
 * mirror.
 */
export function connectMockDesignerRuntimeSession(
  projectId: string,
  data: ProjectData
) {
  claimMockRuntimeAuthority(projectId);
  const session = configureMockRuntimeProjectData(projectId, data);

  if (isMockRuntimeAuthority(projectId)) {
    ensureMockTagRuntimeBridge(projectId, data);
    attachDesignerTagRuntime(session.tags);
    return;
  }

  attachDesignerTagRuntime(getMockTransportTagRuntime(projectId, data));
}
