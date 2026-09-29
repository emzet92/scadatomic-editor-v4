import type { ProcessObjectState } from "./process-path";
import type {
  ProcessProgressTagBinding,
  ProcessStateTagBinding,
} from "./process-definition";

const PROCESS_STATES = new Set<ProcessObjectState>([
  "raw",
  "processing",
  "inspection",
  "passed",
  "rejected",
]);

export function normalizeProcessProgress(
  rawValue: unknown,
  binding: ProcessProgressTagBinding,
): number | undefined {
  if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) return undefined;
  const span = binding.inputMax - binding.inputMin;
  if (!Number.isFinite(span) || Math.abs(span) < Number.EPSILON) return undefined;
  return clamp01((rawValue - binding.inputMin) / span);
}

export function resolveProcessObjectState(
  rawValue: unknown,
  binding: ProcessStateTagBinding,
): ProcessObjectState | undefined {
  const key = String(rawValue);
  const mapped = binding.mapping?.[key];
  if (mapped) return mapped;
  return isProcessObjectState(rawValue) ? rawValue : undefined;
}

export function isProcessObjectState(value: unknown): value is ProcessObjectState {
  return typeof value === "string" && PROCESS_STATES.has(value as ProcessObjectState);
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
