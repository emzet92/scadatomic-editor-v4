import type { DesignSystem } from "./colors";
import {
  countTokenReferences,
  isDesignTokenReference,
  isRecord,
  replaceTokenReferences,
  type DesignTokenBase,
  type DesignTokenReference,
} from "./tokens";

export type ShadowTokenId = string;

export type ShadowStyle = {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
};

export type ShadowToken = DesignTokenBase & ShadowStyle;
export type ShadowTokenRef = DesignTokenReference<"shadow-token">;
export type ShadowValue = ShadowStyle | ShadowTokenRef;

export const DEFAULT_SHADOW_STYLE: ShadowStyle = {
  x: 0,
  y: 4,
  blur: 12,
  spread: -2,
  color: "rgba(15, 23, 42, 0.12)",
};

export function createShadowTokenRef(tokenId: ShadowTokenId): ShadowTokenRef {
  return { kind: "shadow-token", tokenId };
}

export function isShadowTokenRef(value: unknown): value is ShadowTokenRef {
  return isDesignTokenReference(value, "shadow-token");
}

export function isShadowStyle(value: unknown): value is ShadowStyle {
  if (!isRecord(value)) return false;
  return (
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFiniteNumber(value.blur) && value.blur >= 0 &&
    isFiniteNumber(value.spread) &&
    typeof value.color === "string" && value.color.trim().length > 0
  );
}

export function isShadowToken(value: unknown, id?: string): value is ShadowToken {
  if (!isRecord(value) || !isShadowStyle(value)) return false;
  const candidate = value as ShadowStyle & Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    (id === undefined || candidate.id === id) &&
    typeof candidate.name === "string" &&
    candidate.name.trim().length > 0 &&
    (candidate.description === undefined || typeof candidate.description === "string")
  );
}

export function resolveShadowStyle(
  value: unknown,
  designSystem: DesignSystem | undefined,
  fallback: ShadowStyle = DEFAULT_SHADOW_STYLE
): ShadowStyle {
  if (isShadowStyle(value)) return value;
  if (isShadowTokenRef(value)) {
    const token = designSystem?.shadows?.[value.tokenId];
    if (token) return pickStyle(token);
  }
  return fallback;
}

export function resolveShadowValue(
  value: unknown,
  designSystem: DesignSystem | undefined,
  fallback = "none"
): string {
  if (typeof value === "string" && value.trim()) return value;
  if (!isShadowStyle(value) && !isShadowTokenRef(value)) return fallback;
  return shadowStyleToCss(resolveShadowStyle(value, designSystem));
}

export function shadowStyleToCss(style: ShadowStyle): string {
  return `${style.x}px ${style.y}px ${style.blur}px ${style.spread}px ${style.color}`;
}

export function detachShadowTokenReference(
  value: unknown,
  tokenId: ShadowTokenId,
  replacement: ShadowStyle
): unknown {
  return replaceTokenReferences(
    value,
    (candidate) => isShadowTokenRef(candidate) && candidate.tokenId === tokenId,
    () => ({ ...replacement })
  );
}

export function countShadowTokenReferences(value: unknown, tokenId: ShadowTokenId): number {
  return countTokenReferences(
    value,
    (candidate) => isShadowTokenRef(candidate) && candidate.tokenId === tokenId
  );
}

export function createStarterShadowTokens(): ShadowToken[] {
  return [
    createToken("Elevation/None", 0, 0, 0, 0, "rgba(15, 23, 42, 0)"),
    createToken("Elevation/1", 0, 1, 2, 0, "rgba(15, 23, 42, 0.08)"),
    createToken("Elevation/2", 0, 4, 10, -2, "rgba(15, 23, 42, 0.12)"),
    createToken("Elevation/3", 0, 10, 24, -6, "rgba(15, 23, 42, 0.16)"),
    createToken("Elevation/4", 0, 18, 40, -8, "rgba(15, 23, 42, 0.20)"),
  ];
}

function createToken(
  name: string,
  x: number,
  y: number,
  blur: number,
  spread: number,
  color: string
): ShadowToken {
  return { id: crypto.randomUUID(), name, x, y, blur, spread, color };
}

function pickStyle(token: ShadowToken): ShadowStyle {
  return {
    x: token.x,
    y: token.y,
    blur: token.blur,
    spread: token.spread,
    color: token.color,
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
