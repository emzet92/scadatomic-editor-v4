import {
  parseUiDocument,
  type UiDocument,
} from "../uiframework/core/document";
import { initialDocument } from "../uiframework/registry/initial-values";
import { ensureMockScript } from "./mock-script-store";

export type MockProjectId = string;

export type MockUiProject = {
  id: MockProjectId;
  name: string;
  tree: UiDocument;
  revision: number;
};

const STORAGE_PREFIX = "scadatomic.mock.v5.project.";
const memoryFallback = new Map<string, MockUiProject>();
const DEFAULT_LATENCY_MS = 120;

type MockProjectListener = (project: MockUiProject) => void;
const projectListeners = new Map<MockProjectId, Set<MockProjectListener>>();

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
  seedPrototypeScripts(id);
  return { id, revision: project.revision };
}

export async function getMockProjectById(
  id: MockProjectId
): Promise<MockUiProject> {
  await mockLatency();

  const existing = readProject(id);
  if (existing) {
    seedPrototypeScripts(id);
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
  seedPrototypeScripts(id);
  return clone(seeded);
}


export function getMockProjectSnapshot(id: MockProjectId): MockUiProject | null {
  const project = readProject(id);
  return project ? clone(project) : null;
}

export function subscribeMockProject(
  id: MockProjectId,
  listener: MockProjectListener
): () => void {
  let listeners = projectListeners.get(id);
  if (!listeners) {
    listeners = new Set();
    projectListeners.set(id, listeners);
  }
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== storageKey(id) || !event.newValue) {
      return;
    }

    try {
      listener(clone(parseMockProject(JSON.parse(event.newValue))));
    } catch (error) {
      console.error(`[mock-http] Invalid project update ${id}`, error);
    }
  };

  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener("storage", onStorage);
    const current = projectListeners.get(id);
    current?.delete(listener);
    if (current?.size === 0) {
      projectListeners.delete(id);
    }
  };
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

  notifyProjectListeners(snapshot);
}

function notifyProjectListeners(project: MockUiProject) {
  for (const listener of projectListeners.get(project.id) ?? []) {
    listener(clone(project));
  }
}

function seedPrototypeScripts(projectId: string) {
  ensureMockScript(
    projectId,
    "startButton.Clicked",
    `ctx.emit("pump.start");`
  );

  ensureMockScript(
    projectId,
    "stopButton.Clicked",
    `ctx.emit("pump.stop");`
  );

  ensureMockScript(
    projectId,
    "randomColorButton.RandomColorClicked",
    `ctx.ui.Button3.backgroundColor = ctx.random.color();`
  );

  ensureMockScript(
    projectId,
    "startButton.method.enable",
    `self.disabled = false;`
  );
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
