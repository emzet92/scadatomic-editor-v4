type AuthorityLease = {
  ownerId: string;
  expiresAt: number;
};

type AuthorityListener = (isAuthority: boolean) => void;

const STORAGE_PREFIX = "scadatomic.mock.runtime-authority.v2.";
const LEASE_MS = 6_000;
const HEARTBEAT_MS = 1_500;
const ownerId = createOwnerId();
const heartbeatTimers = new Map<string, number>();
const listeners = new Map<string, Set<AuthorityListener>>();
const lastKnownAuthority = new Map<string, boolean>();

/**
 * Cross-tab ownership for the local mock I/O host.
 *
 * Only the Designer host should claim authority. Runtime-preview clients never
 * self-promote on a tag write; they behave like HMIs talking to an external
 * PLC/edge runtime. Authority loss is observable so stale drivers can be
 * disposed immediately instead of leaving orphaned simulation timers behind.
 */
export function claimMockRuntimeAuthority(projectId: string) {
  const current = readLease(projectId);
  const now = Date.now();
  if (current && current.ownerId !== ownerId && current.expiresAt > now) {
    updateAuthorityState(projectId, false);
    return false;
  }

  writeLease(projectId, { ownerId, expiresAt: now + LEASE_MS });
  const verified = readLease(projectId);
  const claimed = !!verified && verified.ownerId === ownerId;
  updateAuthorityState(projectId, claimed);
  if (!claimed) return false;

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
  // Browser background-tab throttling may delay the heartbeat beyond LEASE_MS.
  // If localStorage still names this tab as owner, an incoming message is proof
  // that the tab is alive: renew synchronously instead of spuriously dropping
  // authority and spawning a second simulator elsewhere.
  const owns = !!lease && lease.ownerId === ownerId;
  if (owns) {
    if (lease.expiresAt <= Date.now()) {
      writeLease(projectId, { ownerId, expiresAt: Date.now() + LEASE_MS });
    }
    ensureHeartbeat(projectId);
  } else if (heartbeatTimers.has(projectId)) {
    stopHeartbeat(projectId);
  }
  updateAuthorityState(projectId, owns);
  return owns;
}

export function hasLiveMockRuntimeAuthority(projectId: string) {
  const lease = readLease(projectId);
  return !!lease && lease.expiresAt > Date.now();
}

export function releaseMockRuntimeAuthority(projectId: string) {
  const lease = readLease(projectId);
  if (lease?.ownerId === ownerId) {
    try {
      localStorage.removeItem(storageKey(projectId));
    } catch {
      // Local development fallback: authority will naturally expire.
    }
  }
  stopHeartbeat(projectId);
  updateAuthorityState(projectId, false);
}

export function subscribeMockRuntimeAuthority(
  projectId: string,
  listener: AuthorityListener
) {
  const current = listeners.get(projectId) ?? new Set<AuthorityListener>();
  current.add(listener);
  listeners.set(projectId, current);
  listener(isMockRuntimeAuthority(projectId));
  return () => {
    current.delete(listener);
    if (current.size === 0) listeners.delete(projectId);
  };
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
      updateAuthorityState(projectId, false);
      return;
    }
    writeLease(projectId, {
      ownerId,
      expiresAt: Date.now() + LEASE_MS,
    });
    updateAuthorityState(projectId, true);
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

function updateAuthorityState(projectId: string, next: boolean) {
  if (lastKnownAuthority.get(projectId) === next) return;
  lastKnownAuthority.set(projectId, next);
  for (const listener of listeners.get(projectId) ?? []) listener(next);
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

function projectIdFromStorageKey(key: string | null) {
  return key?.startsWith(STORAGE_PREFIX) ? key.slice(STORAGE_PREFIX.length) : undefined;
}

function createOwnerId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `runtime-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    const projectId = projectIdFromStorageKey(event.key);
    if (!projectId || !heartbeatTimers.has(projectId)) return;
    const lease = readLease(projectId);
    if (!lease || lease.ownerId !== ownerId) {
      stopHeartbeat(projectId);
      updateAuthorityState(projectId, false);
    }
  });

  window.addEventListener("pagehide", () => {
    for (const projectId of [...heartbeatTimers.keys()]) {
      releaseMockRuntimeAuthority(projectId);
    }
  });
}
