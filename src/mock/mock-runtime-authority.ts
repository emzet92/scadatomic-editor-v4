type AuthorityLease = {
  ownerId: string;
  expiresAt: number;
};

const STORAGE_PREFIX = "scadatomic.mock.runtime-authority.v1.";
const LEASE_MS = 4_000;
const HEARTBEAT_MS = 1_000;
const ownerId = createOwnerId();
const heartbeatTimers = new Map<string, number>();

/**
 * Cross-tab ownership for the local mock I/O host.
 *
 * Only the authority for a project may run source drivers and publish canonical
 * tag readback. Runtime-preview tabs remain clients and send write requests to
 * that authority, just like an HMI writing to a real PLC/edge runtime.
 */
export function claimMockRuntimeAuthority(projectId: string) {
  const current = readLease(projectId);
  const now = Date.now();
  if (current && current.ownerId !== ownerId && current.expiresAt > now) {
    return false;
  }

  writeLease(projectId, { ownerId, expiresAt: now + LEASE_MS });
  const verified = readLease(projectId);
  if (!verified || verified.ownerId !== ownerId) return false;

  ensureHeartbeat(projectId);
  return true;
}

export function ensureMockRuntimeAuthority(projectId: string) {
  if (isMockRuntimeAuthority(projectId)) return true;
  const current = readLease(projectId);
  if (current && current.expiresAt > Date.now()) return false;
  return claimMockRuntimeAuthority(projectId);
}

export function isMockRuntimeAuthority(projectId: string) {
  const lease = readLease(projectId);
  if (!lease || lease.ownerId !== ownerId || lease.expiresAt <= Date.now()) {
    if (heartbeatTimers.has(projectId)) stopHeartbeat(projectId);
    return false;
  }
  return true;
}

export function hasLiveMockRuntimeAuthority(projectId: string) {
  const lease = readLease(projectId);
  return !!lease && lease.expiresAt > Date.now();
}

export function releaseMockRuntimeAuthority(projectId: string) {
  if (isMockRuntimeAuthority(projectId)) {
    try {
      localStorage.removeItem(storageKey(projectId));
    } catch {
      // Local development fallback: authority will naturally expire.
    }
  }
  stopHeartbeat(projectId);
}

export function getMockRuntimeAuthorityOwnerId() {
  return ownerId;
}

function ensureHeartbeat(projectId: string) {
  if (heartbeatTimers.has(projectId) || typeof window === "undefined") return;
  const timer = window.setInterval(() => {
    const lease = readLease(projectId);
    if (!lease || lease.ownerId !== ownerId) {
      stopHeartbeat(projectId);
      return;
    }
    writeLease(projectId, {
      ownerId,
      expiresAt: Date.now() + LEASE_MS,
    });
  }, HEARTBEAT_MS);
  heartbeatTimers.set(projectId, timer);
}

function stopHeartbeat(projectId: string) {
  const timer = heartbeatTimers.get(projectId);
  if (timer !== undefined && typeof window !== "undefined") {
    window.clearInterval(timer);
  }
  heartbeatTimers.delete(projectId);
}

function readLease(projectId: string): AuthorityLease | undefined {
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<AuthorityLease>;
    return typeof parsed.ownerId === "string" && typeof parsed.expiresAt === "number"
      ? { ownerId: parsed.ownerId, expiresAt: parsed.expiresAt }
      : undefined;
  } catch {
    return undefined;
  }
}

function writeLease(projectId: string, lease: AuthorityLease) {
  try {
    localStorage.setItem(storageKey(projectId), JSON.stringify(lease));
  } catch {
    // If localStorage is unavailable, this tab is effectively the local host.
  }
}

function storageKey(projectId: string) {
  return `${STORAGE_PREFIX}${projectId}`;
}

function createOwnerId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `runtime-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    for (const projectId of [...heartbeatTimers.keys()]) {
      releaseMockRuntimeAuthority(projectId);
    }
  });
}
