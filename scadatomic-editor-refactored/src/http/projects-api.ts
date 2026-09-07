import type {
  LegacyUiTree,
  UiDocument,
} from "../uiframework/core/document";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  `${window.location.protocol}//${window.location.hostname}:8080`;

export type ProjectId = string;

export type UiProjectResponse = {
  id: ProjectId;
  name: string;
  tree: UiDocument | LegacyUiTree;
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
    const body = await response.text().catch(() => "");
    throw new Error(
      `HTTP ${response.status} ${response.statusText}: ${body}`
    );
  }

  return response.json() as Promise<TResponse>;
}

export async function createProject(
  request: SaveUiDocumentRequest
): Promise<CreateUiProjectResponse> {
  return requestJson<CreateUiProjectResponse>(`${API_BASE_URL}/api/projects`, {
    method: "POST",
    body: JSON.stringify(toLegacyWireRequest(request)),
  });
}

export async function getProjectById(
  id: ProjectId
): Promise<UiProjectResponse> {
  return requestJson<UiProjectResponse>(`${API_BASE_URL}/api/projects/${id}`, {
    method: "GET",
  });
}

export async function updateProject(
  id: ProjectId,
  request: SaveUiDocumentRequest,
  revision?: number
): Promise<UiProjectResponse> {
  return requestJson<UiProjectResponse>(`${API_BASE_URL}/api/projects/${id}`, {
    method: "PUT",
    ...(revision === undefined
      ? {}
      : {
          headers: {
            "If-Match": String(revision),
          },
        }),
    body: JSON.stringify(toLegacyWireRequest(request)),
  });
}

function toLegacyWireRequest(request: SaveUiDocumentRequest) {
  return {
    name: request.name,
    tree: request.tree.nodes,
  };
}
