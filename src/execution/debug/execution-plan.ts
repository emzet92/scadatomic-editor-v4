import type { HandlerExecutionPlan } from "../runtime/handler-execution-plan";

const STORAGE_PREFIX = "scadatomic.execution-plan.v1.";
const localListeners = new Set<(plan: HandlerExecutionPlan) => void>();
let channel: BroadcastChannel | undefined;

function getChannel(): BroadcastChannel | undefined {
  if (typeof BroadcastChannel === "undefined") return undefined;
  channel ??= new BroadcastChannel("scadatomic.execution-plan.v1");
  return channel;
}

/**
 * Stores the planner output before execution starts. This snapshot is never
 * updated with executor statuses, so it remains a faithful view of the plan.
 */
export function publishExecutionPlan(plan: HandlerExecutionPlan): void {
  const safePlan = makeSerializable(plan);
  try {
    localStorage.setItem(
      storageKey(plan.projectId, plan.handlerId),
      JSON.stringify(safePlan)
    );
  } catch {
    // Debug plan persistence is best effort only.
  }

  for (const listener of localListeners) listener(safePlan);
  try {
    getChannel()?.postMessage(safePlan);
  } catch {
    // Cross-tab debugging is best effort only.
  }
}

export function getLatestExecutionPlan(
  projectId: string,
  handlerId: string
): HandlerExecutionPlan | null {
  try {
    const raw = localStorage.getItem(storageKey(projectId, handlerId));
    return raw ? (JSON.parse(raw) as HandlerExecutionPlan) : null;
  } catch {
    return null;
  }
}

export function subscribeExecutionPlan(
  projectId: string,
  handlerId: string,
  listener: (plan: HandlerExecutionPlan) => void
): () => void {
  const local = (plan: HandlerExecutionPlan) => {
    if (plan.projectId === projectId && plan.handlerId === handlerId) {
      listener(plan);
    }
  };
  localListeners.add(local);

  const broadcast = (event: MessageEvent<HandlerExecutionPlan>) => {
    const plan = event.data;
    if (plan?.projectId === projectId && plan.handlerId === handlerId) {
      listener(plan);
    }
  };
  getChannel()?.addEventListener("message", broadcast);

  return () => {
    localListeners.delete(local);
    getChannel()?.removeEventListener("message", broadcast);
  };
}

function storageKey(projectId: string, handlerId: string): string {
  return `${STORAGE_PREFIX}${encodeURIComponent(projectId)}.${encodeURIComponent(handlerId)}`;
}

function makeSerializable(plan: HandlerExecutionPlan): HandlerExecutionPlan {
  try {
    return structuredClone(plan);
  } catch {
    return JSON.parse(
      JSON.stringify(plan, (_key, value) => {
        if (typeof value === "function") {
          return `[Function ${value.name || "anonymous"}]`;
        }
        if (typeof value === "bigint") return String(value);
        return value;
      })
    ) as HandlerExecutionPlan;
  }
}
