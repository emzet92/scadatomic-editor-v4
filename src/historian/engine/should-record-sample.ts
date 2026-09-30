import type {
  HistorianSample,
  HistorianSamplingPolicy,
  HistorianScalar,
  HistorianThreshold,
} from "../domain";

export function shouldRecordSample({
  policy,
  previous,
  value,
  now,
  reason,
}: {
  policy: HistorianSamplingPolicy;
  previous: HistorianSample | undefined;
  value: HistorianScalar;
  now: number;
  reason: "change" | "interval" | "initial";
}): boolean {
  if (!previous) return true;

  if (policy.kind === "interval") {
    return now - previous.timestamp >= policy.intervalMs;
  }

  if (policy.kind === "on-change-or-interval") {
    if (now - previous.timestamp >= policy.intervalMs) return true;
    return reason !== "interval" && changedEnough(previous.value, value, policy.threshold);
  }

  if (reason === "interval") return false;
  return changedEnough(previous.value, value, policy.threshold);
}

function changedEnough(
  previous: HistorianScalar,
  next: HistorianScalar,
  threshold: HistorianThreshold | undefined,
): boolean {
  if (Object.is(previous, next)) return false;
  if (!threshold) return true;

  if (typeof previous !== "number" || typeof next !== "number") {
    return true;
  }

  const delta = Math.abs(next - previous);
  if (threshold.kind === "absolute") {
    return delta >= Math.max(0, threshold.value);
  }

  if (delta === 0) return false;
  const baseline = Math.abs(previous);
  if (baseline === 0) return true;
  return (delta / baseline) * 100 >= Math.max(0, threshold.value);
}
