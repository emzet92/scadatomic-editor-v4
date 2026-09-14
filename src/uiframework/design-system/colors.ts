import {
  countTokenReferences,
  isDesignTokenReference,
  isRecord,
  replaceTokenReferences,
  type DesignTokenBase,
  type DesignTokenReference,
} from "./tokens";
import { isTypographyToken, type TypographyToken, type TypographyTokenId } from "./typography";
import { isSpacingToken, type SpacingToken, type SpacingTokenId } from "./spacing";
import { isRadiusToken, type RadiusToken, type RadiusTokenId } from "./radius";

export type ColorTokenId = string;

export type ColorToken = DesignTokenBase & {
  value: string;
};

export type ColorTokenRef = DesignTokenReference<"color-token">;
export type ColorValue = string | ColorTokenRef;

/**
 * Project-local design token collection.
 * Token families deliberately live under one stable designSystem root so new
 * families can be added without changing component/document ownership.
 */
export type DesignSystem = {
  colors: Record<ColorTokenId, ColorToken>;
  typography?: Record<TypographyTokenId, TypographyToken> | undefined;
  spacing?: Record<SpacingTokenId, SpacingToken> | undefined;
  radius?: Record<RadiusTokenId, RadiusToken> | undefined;
};

export const DEFAULT_COLOR_LITERAL = "#18181b";

export function createEmptyDesignSystem(): DesignSystem {
  return { colors: {}, typography: {}, spacing: {}, radius: {} };
}

export function createColorTokenRef(tokenId: ColorTokenId): ColorTokenRef {
  return { kind: "color-token", tokenId };
}

export function isColorTokenRef(value: unknown): value is ColorTokenRef {
  return isDesignTokenReference(value, "color-token");
}

/** Accepts legacy color-only design systems and current multi-family systems. */
export function isDesignSystem(value: unknown): value is DesignSystem {
  if (!isRecord(value) || !isRecord(value.colors)) return false;
  const colorsValid = Object.entries(value.colors).every(([id, token]) => {
    if (!isRecord(token)) return false;
    return (
      token.id === id &&
      typeof token.name === "string" &&
      token.name.trim().length > 0 &&
      typeof token.value === "string" &&
      token.value.trim().length > 0 &&
      (token.description === undefined || typeof token.description === "string")
    );
  });
  if (!colorsValid) return false;

  if (value.typography !== undefined) {
    if (!isRecord(value.typography)) return false;
    if (!Object.entries(value.typography).every(([id, token]) => isTypographyToken(token, id))) {
      return false;
    }
  }

  if (value.spacing !== undefined) {
    if (!isRecord(value.spacing)) return false;
    if (!Object.entries(value.spacing).every(([id, token]) => isSpacingToken(token, id))) {
      return false;
    }
  }

  if (value.radius !== undefined) {
    if (!isRecord(value.radius)) return false;
    if (!Object.entries(value.radius).every(([id, token]) => isRadiusToken(token, id))) {
      return false;
    }
  }

  return true;
}

export function normalizeColorForNativeInput(value: string, fallback = "#18181b") {
  const normalized = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) return normalized;
  if (/^#[0-9a-fA-F]{3}$/.test(normalized)) {
    const [, r, g, b] = normalized;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return fallback;
}

export function resolveColorValue(
  value: unknown,
  designSystem: DesignSystem | undefined,
  fallback = DEFAULT_COLOR_LITERAL
): string {
  if (typeof value === "string" && value.trim()) return value;
  if (isColorTokenRef(value)) {
    return designSystem?.colors[value.tokenId]?.value ?? fallback;
  }
  return fallback;
}

export function detachColorTokenReference(
  value: unknown,
  tokenId: ColorTokenId,
  replacement: string
): unknown {
  return replaceTokenReferences(
    value,
    (candidate) => isColorTokenRef(candidate) && candidate.tokenId === tokenId,
    () => replacement
  );
}

export function countColorTokenReferences(value: unknown, tokenId: ColorTokenId): number {
  return countTokenReferences(
    value,
    (candidate) => isColorTokenRef(candidate) && candidate.tokenId === tokenId
  );
}

export function createStarterColorTokens(): ColorToken[] {
  return [
    createToken("Brand/Primary", "#7c3aed"),
    createToken("Brand/Primary Hover", "#6d28d9"),
    createToken("Surface/Default", "#ffffff"),
    createToken("Surface/Muted", "#f4f4f5"),
    createToken("Text/Primary", "#18181b"),
    createToken("Text/Muted", "#71717a"),
    createToken("Status/Success", "#16a34a"),
    createToken("Status/Warning", "#d97706"),
    createToken("Status/Danger", "#dc2626"),
  ];
}

function createToken(name: string, value: string): ColorToken {
  return {
    id: crypto.randomUUID(),
    name,
    value,
  };
}
