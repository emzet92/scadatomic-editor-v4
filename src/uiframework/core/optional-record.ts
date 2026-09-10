/**
 * Immutable update helper for optional keyed maps used throughout UiNode.
 * Empty maps collapse back to `undefined`, preserving the canonical document
 * shape and avoiding repeated clone/delete/Object.keys boilerplate.
 */
export function setOptionalRecordEntry<T>(
  record: Readonly<Record<string, T>> | undefined,
  key: string,
  value: T | null
): Record<string, T> | undefined {
  const next = { ...(record ?? {}) };

  if (value === null) delete next[key];
  else next[key] = value;

  return Object.keys(next).length > 0 ? next : undefined;
}
