import type { GuardExpression, MachineValue, ValueRef } from "../domain/state-machine-definition";
import type { StateMachineInstance } from "../domain/state-machine-instance";

export type StateMachineValues = {
  readTag(path: string): unknown;
};

export function evaluateGuard(
  expression: GuardExpression | undefined,
  instance: StateMachineInstance,
  values: StateMachineValues,
): boolean {
  if (!expression) return true;
  switch (expression.kind) {
    case "literal": return expression.value;
    case "truthy": return Boolean(resolveValue(expression.value, instance, values));
    case "not": return !evaluateGuard(expression.expression, instance, values);
    case "and": return expression.expressions.every((item) => evaluateGuard(item, instance, values));
    case "or": return expression.expressions.some((item) => evaluateGuard(item, instance, values));
    case "compare": {
      const left = resolveValue(expression.left, instance, values);
      const right = expression.right;
      switch (expression.operator) {
        case "eq": return Object.is(left, right);
        case "neq": return !Object.is(left, right);
        case "gt": return numeric(left) > numeric(right);
        case "gte": return numeric(left) >= numeric(right);
        case "lt": return numeric(left) < numeric(right);
        case "lte": return numeric(left) <= numeric(right);
      }
    }
  }
}

export function resolveValue(ref: ValueRef, instance: StateMachineInstance, values: StateMachineValues): unknown {
  return ref.kind === "tag" ? values.readTag(ref.path) : instance.context[ref.key];
}

function numeric(value: unknown): number {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function literalValue(value: unknown): MachineValue {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null
    ? value
    : String(value);
}
