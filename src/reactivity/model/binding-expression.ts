import type { ReactiveRef } from "./reactive-ref";
import { isReactiveRef } from "./reactive-ref";

export type BindingExpression =
  | { type: "constant"; value: unknown }
  | { type: "ref"; ref: ReactiveRef }
  | { type: "not"; operand: BindingExpression }
  | { type: "equals"; left: BindingExpression; right: BindingExpression }
  | { type: "not-equals"; left: BindingExpression; right: BindingExpression }
  | { type: "greater-than"; left: BindingExpression; right: BindingExpression }
  | { type: "less-than"; left: BindingExpression; right: BindingExpression }
  | { type: "and"; operands: BindingExpression[] }
  | { type: "or"; operands: BindingExpression[] }
  | {
      type: "conditional";
      condition: BindingExpression;
      whenTrue: BindingExpression;
      whenFalse: BindingExpression;
    }
  | { type: "format"; template: string; value: BindingExpression };

export function isBindingExpression(value: unknown): value is BindingExpression {
  if (!isRecord(value) || typeof value.type !== "string") return false;

  switch (value.type) {
    case "constant":
      return Object.prototype.hasOwnProperty.call(value, "value");
    case "ref":
      return isReactiveRef(value.ref);
    case "not":
      return isBindingExpression(value.operand);
    case "equals":
    case "not-equals":
    case "greater-than":
    case "less-than":
      return isBindingExpression(value.left) && isBindingExpression(value.right);
    case "and":
    case "or":
      return Array.isArray(value.operands) && value.operands.every(isBindingExpression);
    case "conditional":
      return isBindingExpression(value.condition) &&
        isBindingExpression(value.whenTrue) &&
        isBindingExpression(value.whenFalse);
    case "format":
      return typeof value.template === "string" && isBindingExpression(value.value);
    default:
      return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
