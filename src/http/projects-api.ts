import {
  createMockProject,
  getMockProjectById,
  updateMockProject,
} from "../mock/mock-project-store";
import type { UiDocument } from "../uiframework/core/document";

export type ProjectId = string;

export type UiProjectResponse = {
  id: ProjectId;
  name: string;
  tree: UiDocument;
  revision?: number;
};

export type SaveUiDocumentRequest = {
  name: string;
  tree: UiDocument;
};

export type CreateUiProjectResponse = {
  id: ProjectId;
  revision?: number;
};

/**
 * Development API adapter.
 *
 * There is intentionally no network request here. The mock persists projects
 * in localStorage, adds a small artificial latency and keeps the same public
 * API as the future HTTP implementation.
 */
export async function createProject(
  request: SaveUiDocumentRequest
): Promise<CreateUiProjectResponse> {
  return createMockProject(request);
}

export async function getProjectById(
  id: ProjectId
): Promise<UiProjectResponse> {
  return getMockProjectById(id);
}

export async function updateProject(
  id: ProjectId,
  request: SaveUiDocumentRequest,
  revision?: number
): Promise<UiProjectResponse> {
  return updateMockProject(id, request, revision);
}
