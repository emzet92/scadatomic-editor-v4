import type { DesignSystem } from "./colors";
import {
  countTokenReferences,
  isDesignTokenReference,
  isRecord,
  replaceTokenReferences,
  type DesignTokenBase,
  type DesignTokenReference,
} from "./tokens";

export type BorderTokenId = string;
export type BorderLineStyle = "solid" | "dashed" | "dotted" | "double";

export type BorderStyle = {
  width: number;
  style: BorderLineStyle;
  color: string;
};

export type BorderToken = DesignTokenBase & BorderStyle;
export type BorderTokenRef = DesignTokenReference<"border-token">;
export type BorderValue = BorderStyle | BorderTokenRef;

export const DEFAULT_BORDER_STYLE: BorderStyle = {
  width: 1,
  style: "solid",
  color: "#d4d4d8",
};

export function createBorderTokenRef(tokenId: BorderTokenId): BorderTokenRef {
  return { kind: "border-token", tokenId };
}

export function isBorderTokenRef(value: unknown): value is BorderTokenRef {
  return isDesignTokenReference(value, "border-token");
}

export function isBorderLineStyle(value: unknown): value is BorderLineStyle {
  return value === "solid" || value === "dashed" || value === "dotted" || value === "double";
}

export function isBorderStyle(value: unknown): value is BorderStyle {
  if (!isRecord(value)) return false;
  return (
    isFiniteNumber(value.width) &&
    value.width >= 0 &&
    isBorderLineStyle(value.style) &&
    typeof value.color === "string" &&
    value.color.trim().length > 0
  );
}

export function isBorderToken(value: unknown, id?: string): value is BorderToken {
  if (!isRecord(value) || !isBorderStyle(value)) return false;
  const candidate = value as BorderStyle & Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    (id === undefined || candidate.id === id) &&
    typeof candidate.name === "string" &&
    candidate.name.trim().length > 0 &&
    (candidate.description === undefined || typeof candidate.description === "string")
  );
}

export function resolveBorderStyle(
  value: unknown,
  designSystem: DesignSystem | undefined,
  fallback: BorderStyle = DEFAULT_BORDER_STYLE
): BorderStyle {
  if (isBorderStyle(value)) return value;
  if (isBorderTokenRef(value)) {
    const token = designSystem?.borders?.[value.tokenId];
    if (token) return pickStyle(token);
  }
  return fallback;
}

export function resolveBorderValue(
  value: unknown,
  designSystem: DesignSystem | undefined,
  fallback = "none"
): string {
  if (typeof value === "string" && value.trim()) return value;
  if (!isBorderStyle(value) && !isBorderTokenRef(value)) return fallback;
  return borderStyleToCss(resolveBorderStyle(value, designSystem));
}

export function borderStyleToCss(style: BorderStyle): string {
  if (style.width <= 0) return "none";
  return `${style.width}px ${style.style} ${style.color}`;
}

export function detachBorderTokenReference(
  value: unknown,
  tokenId: BorderTokenId,
  replacement: BorderStyle
): unknown {
  return replaceTokenReferences(
    value,
    (candidate) => isBorderTokenRef(candidate) && candidate.tokenId === tokenId,
    () => ({ ...replacement })
  );
}

export function countBorderTokenReferences(value: unknown, tokenId: BorderTokenId): number {
  return countTokenReferences(
    value,
    (candidate) => isBorderTokenRef(candidate) && candidate.tokenId === tokenId
  );
}

export function createStarterBorderTokens(): BorderToken[] {
  return [
    createToken("Stroke/Subtle", 1, "solid", "#e4e4e7"),
    createToken("Stroke/Default", 1, "solid", "#d4d4d8"),
    createToken("Stroke/Strong", 1, "solid", "#a1a1aa"),
    createToken("Stroke/Focus", 2, "solid", "#7c3aed"),
    createToken("Stroke/Dashed", 1, "dashed", "#a1a1aa"),
  ];
}

function createToken(
  name: string,
  width: number,
  style: BorderLineStyle,
  color: string
): BorderToken {
  return { id: crypto.randomUUID(), name, width, style, color };
}

function pickStyle(token: BorderToken): BorderStyle {
  return {
    width: token.width,
    style: token.style,
    color: token.color,
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
