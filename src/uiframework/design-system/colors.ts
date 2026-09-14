export type ColorTokenId = string;

export type ColorToken = {
  id: ColorTokenId;
  name: string;
  value: string;
  description?: string | undefined;
};

export type ColorTokenRef = {
  kind: "color-token";
  tokenId: ColorTokenId;
};

export type ColorValue = string | ColorTokenRef;

export type DesignSystem = {
  colors: Record<ColorTokenId, ColorToken>;
};

export const DEFAULT_COLOR_LITERAL = "#18181b";

export function createEmptyDesignSystem(): DesignSystem {
  return { colors: {} };
}

export function createColorTokenRef(tokenId: ColorTokenId): ColorTokenRef {
  return { kind: "color-token", tokenId };
}

export function isColorTokenRef(value: unknown): value is ColorTokenRef {
  return (
    isRecord(value) &&
    value.kind === "color-token" &&
    typeof value.tokenId === "string"
  );
}

export function isDesignSystem(value: unknown): value is DesignSystem {
  if (!isRecord(value) || !isRecord(value.colors)) return false;
  return Object.entries(value.colors).every(([id, token]) => {
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

/**
 * Resolve design-token references immediately before rendering.
 *
 * Documents keep stable references while React components continue receiving
 * plain values. The resolver is deliberately independent from React so future
 * renderers (native, PDF, server-side, etc.) can use the same contract.
 */
export function resolveDesignTokenReferences(
  value: unknown,
  designSystem: DesignSystem | undefined
): unknown {
  if (isColorTokenRef(value)) {
    return resolveColorValue(value, designSystem);
  }
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

export function detachColorTokenReference(
  value: unknown,
  tokenId: ColorTokenId,
  replacement: string
): unknown {
  if (isColorTokenRef(value)) {
    return value.tokenId === tokenId ? replacement : value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => detachColorTokenReference(item, tokenId, replacement));
  }
  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      key,
      detachColorTokenReference(nested, tokenId, replacement),
    ])
  );
}

export function countColorTokenReferences(value: unknown, tokenId: ColorTokenId): number {
  if (isColorTokenRef(value)) return value.tokenId === tokenId ? 1 : 0;
  if (Array.isArray(value)) {
    return value.reduce((sum, item) => sum + countColorTokenReferences(item, tokenId), 0);
  }
  if (!isRecord(value)) return 0;
  return Object.values(value).reduce<number>(
    (sum, nested) => sum + countColorTokenReferences(nested, tokenId),
    0
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
