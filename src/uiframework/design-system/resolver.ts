import { isColorTokenRef, resolveColorValue, type DesignSystem } from "./colors";
import { isTypographyTokenRef, resolveTypographyValue } from "./typography";
import { isSpacingTokenRef, resolveSpacingValue } from "./spacing";
import { isRecord } from "./tokens";

/**
 * Resolve project design-token references immediately before rendering.
 * Components stay renderer-agnostic and receive ordinary resolved values.
 */
export function resolveDesignTokenReferences(
  value: unknown,
  designSystem: DesignSystem | undefined
): unknown {
  if (isColorTokenRef(value)) return resolveColorValue(value, designSystem);
  if (isTypographyTokenRef(value)) return resolveTypographyValue(value, designSystem);
  if (isSpacingTokenRef(value)) return resolveSpacingValue(value, designSystem);
  if (Array.isArray(value)) {
    return value.map((item) => resolveDesignTokenReferences(item, designSystem));
  }
  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      key,
      resolveDesignTokenReferences(nested, designSystem),
    ])
  );
}
