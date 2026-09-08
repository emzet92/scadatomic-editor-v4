import {
  parseUiDocument,
  type UiDocument,
} from "../uiframework/core/document";
import { initialDocument } from "../uiframework/registry/initial-values";

export type MockProjectId = string;

export type MockUiProject = {
  id: MockProjectId;
  name: string;
  tree: UiDocument;
  revision: number;
};

const STORAGE_PREFIX = "scadatomic.mock.v2.project.";
const memoryFallback = new Map<string, MockUiProject>();
const DEFAULT_LATENCY_MS = 120;

export async function createMockProject(input: {
  name: string;
  tree: UiDocument;
}): Promise<{ id: MockProjectId; revision: number }> {
  await mockLatency();

  const id = crypto.randomUUID();
  const project: MockUiProject = {
    id,
    name: input.name,
    tree: clone(input.tree),
    revision: 1,
  };

  writeProject(project);
  return { id, revision: project.revision };
}

export async function getMockProjectById(
  id: MockProjectId
): Promise<MockUiProject> {
  await mockLatency();

  const existing = readProject(id);
  if (existing) {
    return clone(existing);
  }

  // Development-friendly behavior: any project URL works immediately.
  const seeded: MockUiProject = {
    id,
    name: id === "demo" ? "Pump Station Demo" : `Mock Project ${id}`,
    tree: clone(initialDocument),
    revision: 1,
  };

  writeProject(seeded);
  return clone(seeded);
}

export async function updateMockProject(
  id: MockProjectId,
  input: {
    name: string;
    tree: UiDocument;
  },
  expectedRevision?: number
): Promise<MockUiProject> {
  await mockLatency();

  const current = readProject(id);
  const currentRevision = current?.revision ?? 0;

  if (
    expectedRevision !== undefined &&
    current &&
    expectedRevision !== currentRevision
  ) {
    throw new Error(
      `Mock revision conflict: expected ${expectedRevision}, current ${currentRevision}`
    );
  }

  const project: MockUiProject = {
    id,
    name: input.name,
    tree: clone(input.tree),
    revision: currentRevision + 1,
  };

  writeProject(project);
  return clone(project);
}

export function resetMockProjects() {
  memoryFallback.clear();

  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // localStorage can be unavailable in privacy/sandboxed contexts.
  }
}

function readProject(id: MockProjectId): MockUiProject | null {
  try {
    const raw = localStorage.getItem(storageKey(id));
    if (raw) {
      return parseMockProject(JSON.parse(raw));
    }
  } catch (error) {
    console.error(`[mock-http] Invalid project ${id}`, error);
    return null;
  }

  return memoryFallback.get(id) ?? null;
}

function parseMockProject(value: unknown): MockUiProject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid mock project");
  }

  const project = value as Record<string, unknown>;
  if (
    typeof project.id !== "string" ||
    typeof project.name !== "string" ||
    typeof project.revision !== "number"
  ) {
    throw new Error("Invalid mock project metadata");
  }

  return {
    id: project.id,
    name: project.name,
    revision: project.revision,
    tree: parseUiDocument(project.tree),
  };
}

function writeProject(project: MockUiProject) {
  const snapshot = clone(project);
  memoryFallback.set(project.id, snapshot);

  try {
    localStorage.setItem(storageKey(project.id), JSON.stringify(snapshot));
  } catch {
    // In-memory fallback is enough for a development mock.
  }
}

function storageKey(id: MockProjectId) {
  return `${STORAGE_PREFIX}${id}`;
}

function mockLatency() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, DEFAULT_LATENCY_MS);
  });
}

function clone<T>(value: T): T {
  return structuredClone(value);
}
