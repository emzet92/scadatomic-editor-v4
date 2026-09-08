const STORAGE_PREFIX = "scadatomic.mock.session-state.v1.";

const memoryFallback = new Map<string, Record<string, unknown>>();

export function getMockSessionValue<T>(
  projectId: string,
  key: string,
  fallback?: T
): unknown | T {
  const state = readProjectState(projectId);
  return Object.prototype.hasOwnProperty.call(state, key) ? state[key] : fallback;
}

export function setMockSessionValue(
  projectId: string,
  key: string,
  value: unknown
): void {
  const state = readProjectState(projectId);
  state[key] = cloneSerializable(value);
  writeProjectState(projectId, state);
}

export function deleteMockSessionValue(projectId: string, key: string): void {
  const state = readProjectState(projectId);
  delete state[key];
  writeProjectState(projectId, state);
}

export function clearMockSessionState(projectId: string): void {
  const storageKey = getStorageKey(projectId);
  memoryFallback.delete(storageKey);

  try {
    sessionStorage.removeItem(storageKey);
  } catch {
    // In-memory fallback is enough for the prototype.
  }
}

function readProjectState(projectId: string): Record<string, unknown> {
  const storageKey = getStorageKey(projectId);
  const cached = memoryFallback.get(storageKey);
  if (cached) {
    return { ...cached };
  }

  try {
    const raw = sessionStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      const state = parseState(parsed);
      memoryFallback.set(storageKey, state);
      return { ...state };
    }
  } catch (error) {
    console.warn("[mock-session-state] Failed to read session state", error);
  }

  return {};
}

function writeProjectState(
  projectId: string,
  state: Record<string, unknown>
): void {
  const storageKey = getStorageKey(projectId);
  const snapshot = { ...state };
  memoryFallback.set(storageKey, snapshot);

  try {
    sessionStorage.setItem(storageKey, JSON.stringify(snapshot));
  } catch (error) {
    console.warn("[mock-session-state] Failed to persist session state", error);
  }
}

function parseState(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function getStorageKey(projectId: string) {
  return `${STORAGE_PREFIX}${encodeURIComponent(projectId)}`;
}

function cloneSerializable(value: unknown): unknown {
  if (value === undefined) {
    return null;
  }

  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new Error("Session state values must be JSON-serializable");
  }

  return JSON.parse(serialized) as unknown;
}
