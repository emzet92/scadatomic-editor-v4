import type { ReactiveRef } from "./reactive-ref";
import { isReactiveRef } from "./reactive-ref";

export type ReactiveEventType = "value-changed" | "rising-edge" | "falling-edge";

export type ReactiveEventHandlerBinding = {
  id: string;
  ref: ReactiveRef;
  event: ReactiveEventType;
  handlerId: string;
  enabled?: boolean | undefined;
};

export function isReactiveEventHandlerBinding(
  value: unknown
): value is ReactiveEventHandlerBinding {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" &&
    isReactiveRef(value.ref) &&
    (value.event === "value-changed" ||
      value.event === "rising-edge" ||
      value.event === "falling-edge") &&
    typeof value.handlerId === "string" &&
    (value.enabled === undefined || typeof value.enabled === "boolean");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
