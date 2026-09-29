export type DesignTokenId = string;

export type DesignTokenBase = {
  id: DesignTokenId;
  name: string;
  description?: string | undefined;
};

export type DesignTokenReference<TKind extends string> = {
  kind: TKind;
  tokenId: DesignTokenId;
};

export function isDesignTokenReference<TKind extends string>(
  value: unknown,
  kind: TKind
): value is DesignTokenReference<TKind> {
  return (
    isRecord(value) &&
    value.kind === kind &&
    typeof value.tokenId === "string" &&
    value.tokenId.length > 0
  );
}

/** Recursively replace references without coupling document traversal to a token family. */
export function replaceTokenReferences(
  value: unknown,
  matcher: (candidate: unknown) => boolean,
  replacement: (candidate: unknown) => unknown
): unknown {
  if (matcher(value)) return replacement(value);
  if (Array.isArray(value)) {
    return value.map((item) => replaceTokenReferences(item, matcher, replacement));
  }
  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      key,
      replaceTokenReferences(nested, matcher, replacement),
    ])
  );
}

export function countTokenReferences(
  value: unknown,
  matcher: (candidate: unknown) => boolean
): number {
  if (matcher(value)) return 1;
  if (Array.isArray(value)) {
    return value.reduce((sum, item) => sum + countTokenReferences(item, matcher), 0);
  }
  if (!isRecord(value)) return 0;
  return Object.values(value).reduce<number>(
    (sum, nested) => sum + countTokenReferences(nested, matcher),
    0
  );
}

export function createUniqueTokenName<TToken extends DesignTokenBase>(
  tokens: Record<string, TToken>,
  requestedName: string,
  exceptId?: string
) {
  const occupied = new Set(
    Object.values(tokens)
      .filter((token) => token.id !== exceptId)
      .map((token) => token.name.toLocaleLowerCase())
  );
  if (!occupied.has(requestedName.toLocaleLowerCase())) return requestedName;

  let index = 2;
  while (occupied.has(`${requestedName} ${index}`.toLocaleLowerCase())) index += 1;
  return `${requestedName} ${index}`;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
