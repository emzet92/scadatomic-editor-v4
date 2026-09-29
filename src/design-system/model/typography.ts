import type { DesignSystem } from "./colors";
import {
  countTokenReferences,
  isDesignTokenReference,
  isRecord,
  replaceTokenReferences,
  type DesignTokenBase,
  type DesignTokenReference,
} from "./tokens";

export type TypographyTokenId = string;
export type TypographyWeight = "normal" | "medium" | "semibold" | "bold";

export type TypographyStyle = {
  fontFamily: string;
  fontSize: number;
  fontWeight: TypographyWeight;
  lineHeight: string;
  letterSpacing: number;
};

export type TypographyToken = DesignTokenBase & TypographyStyle;
export type TypographyTokenRef = DesignTokenReference<"typography-token">;
export type TypographyValue = TypographyStyle | TypographyTokenRef;

export const DEFAULT_TYPOGRAPHY_STYLE: TypographyStyle = {
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: 14,
  fontWeight: "normal",
  lineHeight: "20px",
  letterSpacing: 0,
};

export function createTypographyTokenRef(tokenId: TypographyTokenId): TypographyTokenRef {
  return { kind: "typography-token", tokenId };
}

export function isTypographyTokenRef(value: unknown): value is TypographyTokenRef {
  return isDesignTokenReference(value, "typography-token");
}

export function isTypographyStyle(value: unknown): value is TypographyStyle {
  return (
    isRecord(value) &&
    typeof value.fontFamily === "string" &&
    typeof value.fontSize === "number" &&
    isTypographyWeight(value.fontWeight) &&
    typeof value.lineHeight === "string" &&
    typeof value.letterSpacing === "number"
  );
}

export function isTypographyToken(value: unknown, id?: string): value is TypographyToken {
  if (!isRecord(value) || !isTypographyStyle(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    (id === undefined || candidate.id === id) &&
    typeof candidate.name === "string" &&
    candidate.name.trim().length > 0 &&
    (candidate.description === undefined || typeof candidate.description === "string")
  );
}

export function resolveTypographyValue(
  value: unknown,
  designSystem: DesignSystem | undefined,
  fallback: TypographyStyle = DEFAULT_TYPOGRAPHY_STYLE
): TypographyStyle {
  if (isTypographyStyle(value)) return value;
  if (isTypographyTokenRef(value)) {
    const token = designSystem?.typography?.[value.tokenId];
    return token ? typographyTokenToStyle(token) : fallback;
  }
  return fallback;
}

export function typographyTokenToStyle(token: TypographyToken): TypographyStyle {
  return {
    fontFamily: token.fontFamily,
    fontSize: token.fontSize,
    fontWeight: token.fontWeight,
    lineHeight: token.lineHeight,
    letterSpacing: token.letterSpacing,
  };
}

export function detachTypographyTokenReference(
  value: unknown,
  tokenId: TypographyTokenId,
  replacement: TypographyStyle
): unknown {
  return replaceTokenReferences(
    value,
    (candidate) => isTypographyTokenRef(candidate) && candidate.tokenId === tokenId,
    () => replacement
  );
}

export function countTypographyTokenReferences(
  value: unknown,
  tokenId: TypographyTokenId
): number {
  return countTokenReferences(
    value,
    (candidate) => isTypographyTokenRef(candidate) && candidate.tokenId === tokenId
  );
}

export function createStarterTypographyTokens(): TypographyToken[] {
  return [
    createToken("Display/Large", 40, "bold", "48px", -0.6),
    createToken("Heading/Large", 28, "semibold", "36px", -0.3),
    createToken("Heading/Medium", 22, "semibold", "30px", -0.2),
    createToken("Body/Large", 16, "normal", "24px", 0),
    createToken("Body/Medium", 14, "normal", "20px", 0),
    createToken("Label/Medium", 12, "medium", "16px", 0.1),
    createToken("Caption/Small", 11, "normal", "16px", 0.1),
  ];
}

function createToken(
  name: string,
  fontSize: number,
  fontWeight: TypographyWeight,
  lineHeight: string,
  letterSpacing: number
): TypographyToken {
  return {
    id: crypto.randomUUID(),
    name,
    fontFamily: DEFAULT_TYPOGRAPHY_STYLE.fontFamily,
    fontSize,
    fontWeight,
    lineHeight,
    letterSpacing,
  };
}

function isTypographyWeight(value: unknown): value is TypographyWeight {
  return value === "normal" || value === "medium" || value === "semibold" || value === "bold";
}
