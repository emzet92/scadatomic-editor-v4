// src/uiframework/http/projects-api.ts

import type { UiTree } from "../uiframework/Renderer";



export type UiProjectResponse = {
  id: string;
  name: string;
  tree: UiTree;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:8080";

export async function getProjectById(
  id: string
): Promise<UiProjectResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${id}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load project ${id}: ${response.status}`
    );
  }

  return response.json();
}