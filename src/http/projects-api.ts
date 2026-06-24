import type { UiTree } from "../uiframework/Renderer";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:8080";

export type ProjectId = string;

export type UiProjectResponse = {
  id: ProjectId;
  name: string;
  tree: UiTree;
};

export type SaveUiTreeRequest = {
  name: string;
  tree: UiTree;
};

export type CreateUiProjectResponse = {
  id: ProjectId;
};

async function requestJson<TResponse>(
  url: string,
  options?: RequestInit
): Promise<TResponse> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response
      .text()
      .catch(() => "");

    throw new Error(
      `HTTP ${response.status} ${response.statusText}: ${body}`
    );
  }

  return response.json() as Promise<TResponse>;
}

export async function createProject(
  request: SaveUiTreeRequest
): Promise<CreateUiProjectResponse> {
  return requestJson<CreateUiProjectResponse>(
    `${API_BASE_URL}/api/projects`,
    {
      method: "POST",
      body: JSON.stringify(request),
    }
  );
}

export async function getProjectById(
  id: ProjectId
): Promise<UiProjectResponse> {
  return requestJson<UiProjectResponse>(
    `${API_BASE_URL}/api/projects/${id}`,
    {
      method: "GET",
    }
  );
}

export async function updateProject(
  id: ProjectId,
  request: SaveUiTreeRequest
): Promise<UiProjectResponse> {
  return requestJson<UiProjectResponse>(
    `${API_BASE_URL}/api/projects/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(request),
    }
  );
}