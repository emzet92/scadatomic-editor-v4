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
import { isShadowToken, type ShadowToken, type ShadowTokenId } from "./shadows";
import { isBorderToken, type BorderToken, type BorderTokenId } from "./borders";

export type ColorTokenId = string;
export type DesignThemeId = string;
export type SemanticColorTokenId = string;

export type ColorToken = DesignTokenBase & {
  value: string;
};

export type DesignTheme = {
  id: DesignThemeId;
  name: string;
};

export type ColorTokenRef = DesignTokenReference<"color-token">;
export type SemanticColorTokenRef = DesignTokenReference<"semantic-color-token">;
export type FoundationColorValue = string | ColorTokenRef;
export type ColorValue = FoundationColorValue | SemanticColorTokenRef;

export type SemanticColorToken = DesignTokenBase & {
  values: Record<DesignThemeId, FoundationColorValue>;
};

/**
 * Project-local design token collection.
 *
 * Foundations (colors / typography / spacing / radius / shadows / borders)
 * are stable project assets. Semantic colors sit one level above primitive
 * colors and resolve through the currently active theme.
 */
export type DesignSystem = {
  colors: Record<ColorTokenId, ColorToken>;
  typography?: Record<TypographyTokenId, TypographyToken> | undefined;
  spacing?: Record<SpacingTokenId, SpacingToken> | undefined;
  radius?: Record<RadiusTokenId, RadiusToken> | undefined;
  shadows?: Record<ShadowTokenId, ShadowToken> | undefined;
  borders?: Record<BorderTokenId, BorderToken> | undefined;
  themes?: Record<DesignThemeId, DesignTheme> | undefined;
  activeThemeId?: DesignThemeId | undefined;
  semanticColors?: Record<SemanticColorTokenId, SemanticColorToken> | undefined;
  /** Marks a design system created by the built-in default preset. */
  preset?: "scadatomic-default" | undefined;
};

export const DEFAULT_COLOR_LITERAL = "#18181b";

export function createEmptyDesignSystem(): DesignSystem {
  return {
    colors: {},
    typography: {},
    spacing: {},
    radius: {},
    shadows: {},
    borders: {},
    themes: {},
    semanticColors: {},
  };
}

export function createColorTokenRef(tokenId: ColorTokenId): ColorTokenRef {
  return { kind: "color-token", tokenId };
}

export function createSemanticColorTokenRef(
  tokenId: SemanticColorTokenId
): SemanticColorTokenRef {
  return { kind: "semantic-color-token", tokenId };
}

export function isColorTokenRef(value: unknown): value is ColorTokenRef {
  return isDesignTokenReference(value, "color-token");
}

export function isSemanticColorTokenRef(
  value: unknown
): value is SemanticColorTokenRef {
  return isDesignTokenReference(value, "semantic-color-token");
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

  if (value.shadows !== undefined) {
    if (!isRecord(value.shadows)) return false;
    if (!Object.entries(value.shadows).every(([id, token]) => isShadowToken(token, id))) {
      return false;
    }
  }

  if (value.borders !== undefined) {
    if (!isRecord(value.borders)) return false;
    if (!Object.entries(value.borders).every(([id, token]) => isBorderToken(token, id))) {
      return false;
    }
  }

  if (value.themes !== undefined) {
    if (!isRecord(value.themes)) return false;
    if (!Object.entries(value.themes).every(([id, theme]) => isDesignTheme(theme, id))) {
      return false;
    }
  }

  if (value.activeThemeId !== undefined) {
    if (typeof value.activeThemeId !== "string") return false;
    if (value.themes !== undefined && !value.themes[value.activeThemeId]) return false;
  }

  if (value.semanticColors !== undefined) {
    if (!isRecord(value.semanticColors)) return false;
    if (!Object.entries(value.semanticColors).every(([id, token]) => isSemanticColorToken(token, id))) {
      return false;
    }
  }

  if (value.preset !== undefined && value.preset !== "scadatomic-default") {
    return false;
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
  fallback = DEFAULT_COLOR_LITERAL,
  themeId?: DesignThemeId | undefined
): string {
  return resolveColorValueInternal(value, designSystem, fallback, new Set(), themeId);
}

function resolveColorValueInternal(
  value: unknown,
  designSystem: DesignSystem | undefined,
  fallback: string,
  visitedSemanticIds: Set<string>,
  themeId?: DesignThemeId | undefined
): string {
  if (typeof value === "string" && value.trim()) return value;
  if (isColorTokenRef(value)) {
    return designSystem?.colors[value.tokenId]?.value ?? fallback;
  }
  if (isSemanticColorTokenRef(value)) {
    if (visitedSemanticIds.has(value.tokenId)) return fallback;
    const token = designSystem?.semanticColors?.[value.tokenId];
    if (!token) return fallback;

    const activeThemeId = themeId ?? designSystem?.activeThemeId;
    const source =
      (activeThemeId ? token.values[activeThemeId] : undefined) ??
      Object.values(token.values)[0];
    if (!source) return fallback;

    const nextVisited = new Set(visitedSemanticIds);
    nextVisited.add(value.tokenId);
    return resolveColorValueInternal(source, designSystem, fallback, nextVisited, themeId);
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

export function countSemanticColorTokenReferences(
  value: unknown,
  tokenId: SemanticColorTokenId
): number {
  return countTokenReferences(
    value,
    (candidate) => isSemanticColorTokenRef(candidate) && candidate.tokenId === tokenId
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

function isDesignTheme(value: unknown, id: string): value is DesignTheme {
  return (
    isRecord(value) &&
    value.id === id &&
    typeof value.name === "string" &&
    value.name.trim().length > 0
  );
}

function isSemanticColorToken(value: unknown, id: string): value is SemanticColorToken {
  if (!isRecord(value) || value.id !== id || typeof value.name !== "string" || !value.name.trim()) {
    return false;
  }
  if (value.description !== undefined && typeof value.description !== "string") return false;
  if (!isRecord(value.values)) return false;
  return Object.values(value.values).every(isFoundationColorValue);
}

function isFoundationColorValue(value: unknown): value is FoundationColorValue {
  return (typeof value === "string" && value.trim().length > 0) || isColorTokenRef(value);
}

function createToken(name: string, value: string): ColorToken {
  return {
    id: crypto.randomUUID(),
    name,
    value,
  };
}
