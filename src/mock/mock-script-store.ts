export type MockScript = {
  projectId: string;
  scriptId: string;
  code: string;
  updatedAt: number;
};

// v3 intentionally starts with a clean script namespace. The previous prototype
// generated handler bodies by inspecting scriptId (e.g. "randomcolor"), which
// could hide whether the code actually came from script storage.
const STORAGE_PREFIX = "scadatomic.mock.v3.script.";
const memoryFallback = new Map<string, MockScript>();

export function getMockScript(projectId: string, scriptId: string): MockScript {
  const existing = readScript(projectId, scriptId);
  if (existing) {
    return clone(existing);
  }

  const script: MockScript = {
    projectId,
    scriptId,
    code: createEmptyScriptTemplate(),
    updatedAt: Date.now(),
  };

  writeScript(script);
  return clone(script);
}

export function ensureMockScript(
  projectId: string,
  scriptId: string,
  code: string
): MockScript {
  const existing = readScript(projectId, scriptId);
  if (existing) {
    return clone(existing);
  }

  const script: MockScript = {
    projectId,
    scriptId,
    code,
    updatedAt: Date.now(),
  };

  writeScript(script);
  return clone(script);
}

export function saveMockScript(
  projectId: string,
  scriptId: string,
  code: string
): MockScript {
  const script: MockScript = {
    projectId,
    scriptId,
    code,
    updatedAt: Date.now(),
  };

  writeScript(script);
  return clone(script);
}

export function resetMockScripts() {
  memoryFallback.clear();

  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // In-memory fallback is enough for the prototype.
  }
}

function readScript(projectId: string, scriptId: string): MockScript | null {
  const key = storageKey(projectId, scriptId);

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return parseMockScript(JSON.parse(raw));
    }
  } catch (error) {
    console.error(`[mock-script-store] Invalid script ${scriptId}`, error);
  }

  return memoryFallback.get(key) ?? null;
}

function writeScript(script: MockScript) {
  const key = storageKey(script.projectId, script.scriptId);
  const snapshot = clone(script);
  memoryFallback.set(key, snapshot);

  try {
    localStorage.setItem(key, JSON.stringify(snapshot));
  } catch {
    // In-memory fallback is enough for the prototype.
  }
}

function parseMockScript(value: unknown): MockScript {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid mock script");
  }

  const script = value as Record<string, unknown>;
  if (
    typeof script.projectId !== "string" ||
    typeof script.scriptId !== "string" ||
    typeof script.code !== "string" ||
    typeof script.updatedAt !== "number"
  ) {
    throw new Error("Invalid mock script metadata");
  }

  return {
    projectId: script.projectId,
    scriptId: script.scriptId,
    code: script.code,
    updatedAt: script.updatedAt,
  };
}

function storageKey(projectId: string, scriptId: string) {
  return `${STORAGE_PREFIX}${encodeURIComponent(projectId)}.${encodeURIComponent(scriptId)}`;
}

function createEmptyScriptTemplate() {
  return `// ctx is the SCADAtomic prototype runtime API.
ctx.log("handler", ctx.handlerId, "from", ctx.sourceNodeId);

// Examples:
// ctx.ui.Button1.label = "Clicked";
// ctx.ui.Button1.backgroundColor = ctx.random.color();
// ctx.ui.Button1.setProp("disabled", true);
// ctx.emit("my.event", { value: 123 });`;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}
