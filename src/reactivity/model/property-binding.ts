import type { BindingExpression } from "./binding-expression";
import { isBindingExpression } from "./binding-expression";
import type { ReactiveRef } from "./reactive-ref";
import { isReactiveRef } from "./reactive-ref";

export type ReactivePropertyBinding = {
  kind: "reactive";
  id: string;
  dependencies: ReactiveRef[];
  expression: BindingExpression;
  enabled?: boolean | undefined;
};

export type RuntimePropertyBinding = ReactivePropertyBinding & {
  target: {
    componentId: string;
    property: string;
  };
};

export function createReactivePropertyBinding(
  expression: BindingExpression,
  dependencies: ReactiveRef[]
): ReactivePropertyBinding {
  return {
    kind: "reactive",
    id: crypto.randomUUID(),
    dependencies,
    expression,
    enabled: true,
  };
}

export function isReactivePropertyBinding(
  value: unknown
): value is ReactivePropertyBinding {
  if (!isRecord(value) || value.kind !== "reactive") return false;
  return typeof value.id === "string" &&
    Array.isArray(value.dependencies) &&
    value.dependencies.every(isReactiveRef) &&
    isBindingExpression(value.expression) &&
    (value.enabled === undefined || typeof value.enabled === "boolean");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
