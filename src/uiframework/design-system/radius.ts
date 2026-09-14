import type { DesignSystem } from "./colors";
import {
  countTokenReferences,
  isDesignTokenReference,
  isRecord,
  replaceTokenReferences,
  type DesignTokenBase,
  type DesignTokenReference,
} from "./tokens";

export type RadiusTokenId = string;

export type RadiusToken = DesignTokenBase & {
  value: number;
};

export type RadiusTokenRef = DesignTokenReference<"radius-token">;
export type RadiusValue = number | RadiusTokenRef;

export const DEFAULT_RADIUS_LITERAL = 0;

export function createRadiusTokenRef(tokenId: RadiusTokenId): RadiusTokenRef {
  return { kind: "radius-token", tokenId };
}

export function isRadiusTokenRef(value: unknown): value is RadiusTokenRef {
  return isDesignTokenReference(value, "radius-token");
}

export function isRadiusToken(value: unknown, id?: string): value is RadiusToken {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    (id === undefined || value.id === id) &&
    typeof value.name === "string" &&
    value.name.trim().length > 0 &&
    typeof value.value === "number" &&
    Number.isFinite(value.value) &&
    value.value >= 0 &&
    (value.description === undefined || typeof value.description === "string")
  );
}

export function resolveRadiusValue(
  value: unknown,
  designSystem: DesignSystem | undefined,
  fallback = DEFAULT_RADIUS_LITERAL
): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (isRadiusTokenRef(value)) {
    const token = designSystem?.radius?.[value.tokenId];
    return token?.value ?? fallback;
  }
  return fallback;
}

export function detachRadiusTokenReference(
  value: unknown,
  tokenId: RadiusTokenId,
  replacement: number
): unknown {
  return replaceTokenReferences(
    value,
    (candidate) => isRadiusTokenRef(candidate) && candidate.tokenId === tokenId,
    () => replacement
  );
}

export function countRadiusTokenReferences(value: unknown, tokenId: RadiusTokenId): number {
  return countTokenReferences(
    value,
    (candidate) => isRadiusTokenRef(candidate) && candidate.tokenId === tokenId
  );
}

export function createStarterRadiusTokens(): RadiusToken[] {
  return [
    createToken("Radius/None", 0),
    createToken("Radius/XS", 2),
    createToken("Radius/SM", 4),
    createToken("Radius/MD", 8),
    createToken("Radius/LG", 12),
    createToken("Radius/XL", 16),
    createToken("Radius/2XL", 24),
    createToken("Radius/Pill", 999),
  ];
}

function createToken(name: string, value: number): RadiusToken {
  return {
    id: crypto.randomUUID(),
    name,
    value,
  };
}
