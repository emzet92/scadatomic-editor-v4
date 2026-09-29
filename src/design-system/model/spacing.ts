import type { DesignSystem } from "./colors";
import {
  countTokenReferences,
  isDesignTokenReference,
  isRecord,
  replaceTokenReferences,
  type DesignTokenBase,
  type DesignTokenReference,
} from "./tokens";

export type SpacingTokenId = string;

export type SpacingToken = DesignTokenBase & {
  value: number;
};

export type SpacingTokenRef = DesignTokenReference<"spacing-token">;
export type SpacingValue = number | SpacingTokenRef;

export const DEFAULT_SPACING_LITERAL = 0;

export function createSpacingTokenRef(tokenId: SpacingTokenId): SpacingTokenRef {
  return { kind: "spacing-token", tokenId };
}

export function isSpacingTokenRef(value: unknown): value is SpacingTokenRef {
  return isDesignTokenReference(value, "spacing-token");
}

export function isSpacingToken(value: unknown, id?: string): value is SpacingToken {
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

export function resolveSpacingValue(
  value: unknown,
  designSystem: DesignSystem | undefined,
  fallback = DEFAULT_SPACING_LITERAL
): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (isSpacingTokenRef(value)) {
    const token = designSystem?.spacing?.[value.tokenId];
    return token?.value ?? fallback;
  }
  return fallback;
}

export function detachSpacingTokenReference(
  value: unknown,
  tokenId: SpacingTokenId,
  replacement: number
): unknown {
  return replaceTokenReferences(
    value,
    (candidate) => isSpacingTokenRef(candidate) && candidate.tokenId === tokenId,
    () => replacement
  );
}

export function countSpacingTokenReferences(value: unknown, tokenId: SpacingTokenId): number {
  return countTokenReferences(
    value,
    (candidate) => isSpacingTokenRef(candidate) && candidate.tokenId === tokenId
  );
}

export function createStarterSpacingTokens(): SpacingToken[] {
  return [
    createToken("Spacing/2XS", 2),
    createToken("Spacing/XS", 4),
    createToken("Spacing/SM", 8),
    createToken("Spacing/MD", 16),
    createToken("Spacing/LG", 24),
    createToken("Spacing/XL", 32),
    createToken("Spacing/2XL", 48),
  ];
}

function createToken(name: string, value: number): SpacingToken {
  return {
    id: crypto.randomUUID(),
    name,
    value,
  };
}
