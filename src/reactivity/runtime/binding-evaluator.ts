import type { BindingExpression } from "../model/binding-expression";
import type { ReactiveRef } from "../model/reactive-ref";

export type ReactiveValueReader = (ref: ReactiveRef) => unknown;

export function evaluateBindingExpression(
  expression: BindingExpression,
  read: ReactiveValueReader
): unknown {
  switch (expression.type) {
    case "constant":
      return expression.value;
    case "ref":
      return read(expression.ref);
    case "not":
      return !evaluateBindingExpression(expression.operand, read);
    case "equals":
      return Object.is(
        evaluateBindingExpression(expression.left, read),
        evaluateBindingExpression(expression.right, read)
      );
    case "not-equals":
      return !Object.is(
        evaluateBindingExpression(expression.left, read),
        evaluateBindingExpression(expression.right, read)
      );
    case "greater-than":
      return toComparableNumber(evaluateBindingExpression(expression.left, read)) >
        toComparableNumber(evaluateBindingExpression(expression.right, read));
    case "less-than":
      return toComparableNumber(evaluateBindingExpression(expression.left, read)) <
        toComparableNumber(evaluateBindingExpression(expression.right, read));
    case "and":
      return expression.operands.every((operand) =>
        Boolean(evaluateBindingExpression(operand, read))
      );
    case "or":
      return expression.operands.some((operand) =>
        Boolean(evaluateBindingExpression(operand, read))
      );
    case "conditional":
      return evaluateBindingExpression(expression.condition, read)
        ? evaluateBindingExpression(expression.whenTrue, read)
        : evaluateBindingExpression(expression.whenFalse, read);
    case "format": {
      const value = evaluateBindingExpression(expression.value, read);
      return expression.template.replaceAll("{value}", String(value ?? ""));
    }
  }
}

function toComparableNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError(`Binding comparison requires a numeric value, got ${String(value)}.`);
  }
  return number;
}
